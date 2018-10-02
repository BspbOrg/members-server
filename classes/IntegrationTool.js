const crypto = require('crypto')
const mysql = require('mysql2/promise')
const fs = require('fs')

const parseBoricaDate = v => new Date(Date.UTC(
  // year
  v.substr(0, 4),
  // month
  v.substr(4, 2) - 1,
  // day
  v.substr(6, 2),
  // hour
  v.substr(8, 2),
  // minute
  v.substr(10, 2),
  // second
  v.substr(12, 2)
))

module.exports = class IntegrationTool {
  constructor ({ api, config }) {
    this.api = api
    this.config = config
    this.boricaPublicKey = fs.readFileSync(config.boricaPublicKey)
    this.systemPaymentName = config.systemPaymentName
  }

  async connect () {
    const { connection: { driver, host, user, password, port, database, ...other } } = this.config
    return mysql.createConnection({
      host, user, password, port, database, ...other
    })
  }

  async perform (oper) {
    const conn = await this.connect()
    try {
      return await oper(conn)
    } finally {
      conn.end()
    }
  }

  /**
   * @param cursor Last returned cursor to continue from that point
   * @returns {Promise<{rows: {id, raw_data, log_date}[], cursor}>}
   */
  async fetchPayments ({ cursor, limit } = {}) {
    return this.perform(async conn => {
      const [rows] = await conn.query(`
        SELECT id, raw_data as rawData 
        FROM payment_log 
        ${cursor ? 'WHERE id > ?' : ''}
        ORDER BY id
        ${limit ? 'LIMIT ?' : ''}
      `, [
        ...(cursor ? [cursor.id] : []),
        ...(limit ? [limit] : [])
      ])
      return { rows, cursor: { id: rows.length ? rows.slice(-1)[0].id : cursor.id } }
    })
  }

  async decodeBoricaMessage (rawData) {
    const data = rawData.slice(0, 56).toString('utf8')
    const signature = rawData.slice(56, 56 + 128)

    const verify = crypto.createVerify('sha1')
    verify.update(data)
    const valid = verify.verify(this.boricaPublicKey, signature, 'hex')

    if (!valid) return { valid }

    const type = data.substr(0, 2)
    const timestamp = parseBoricaDate(data.substr(2, 14), 'YYYYMMDD')
    const amount = parseInt(data.substr(16, 12)) / 100
    const terminalId = data.substr(28, 8)
    const orderId = data.substr(36, 15).trim()
    const responseCode = data.substr(51, 2)
    const version = data.substr(53, 3)

    const success = responseCode === '00'

    const [, paymentId] = /^(?:MEM|DMEM)_(\d+)$/.exec(orderId) || []

    return {
      type, timestamp, amount, terminalId, orderId, responseCode, version, success, valid, paymentId
    }
  }

  async fetchPaymentMembers (paymentIds) {
    return this.perform(async conn => {
      const [rows] = await conn.query(`
        SELECT h.id as paymentId, username 
        FROM members m
        JOIN members_history h ON m.id = h.member_id
        WHERE h.id in (?)
      `, [paymentIds])
      return rows
    })
  }

  async getMembershipTypeFromPaymentAmount (amount) {
    switch (amount) {
      case 7:
        return 'discounted'
      case 10:
        return 'regular'
      case 15:
        return 'family'
      case 20:
        return 'group'
    }
  }

  async getPaymentsForSync ({ cursor: lastCursor, limit = 500 } = {}) {
    const { rows, cursor } = await this.fetchPayments({ lastCursor, limit })
    const decodedPayments = await Promise.all(
      rows.map(({ rawData }) => this.decodeBoricaMessage(rawData))
    )
    const successPayments = decodedPayments.filter(({ valid, success }) => valid && success)
    const paymentIds = successPayments.map(({ paymentId }) => paymentId)
    const paymentUsernames = await this.fetchPaymentMembers(paymentIds)
    const mapping = paymentUsernames.reduce((map, { paymentId, username }) => ({ ...map, [paymentId]: username }), {})
    const payments = await Promise.all(successPayments.map(async ({ paymentId, amount, timestamp, type, terminalId, orderId }) => ({
      amount,
      paymentDate: timestamp,
      membershipType: await this.getMembershipTypeFromPaymentAmount(amount),
      paymentType: 'card',
      username: mapping[paymentId],
      info: `${orderId}/${terminalId}/${type}`,
      referenceType: 'borica',
      referenceId: paymentId
    })))
    return {
      cursor,
      payments
    }
  }

  async enqueueMembershipUpdate (members) {
    if (!this.config.enabled) return
    return Promise.all(
      members.map(
        member => this.api.tasks.enqueue(
          'IntegrationMembershipUpdate',
          { memberId: member.id || member }
        )
      )
    )
  }

  async getMemberId (username) {
    return this.perform(async (conn) => {
      const [rows] = await conn.query('SELECT id FROM members WHERE username = ?', [username])
      if (rows.length === 1) return rows[0]['id']
      throw new Error(`Cannot find member with username '${username}' in bspb.org db`)
    })
  }

  async createOrUpdateMembershipPayment ({ username, paymentDate }) {
    return this.perform(async (conn) => {
      const memberId = await this.getMemberId(username)
      if (!paymentDate) {
        const [{ affectedRows }] = await conn.query(`DELETE FROM members_history WHERE member_id = ? AND name = ?`, [memberId, this.systemPaymentName])
        return affectedRows === 1
      }
      const [[{ paymentId } = {}]] = await conn.query(`SELECT id as 'paymentId' FROM members_history WHERE member_id = ? AND name = ?`, [memberId, this.systemPaymentName])
      if (!paymentId) {
        const [{ insertId }] = await conn.query('INSERT INTO members_history SET ?', {
          member_id: memberId,
          nomenclature_id: 0,
          type: 'member',
          name: this.systemPaymentName,
          amount: -1,
          payment_date: paymentDate,
          paid_date: paymentDate,
          paid: true
        })
        return insertId
      }
      await conn.query(`UPDATE members_history SET ? WHERE id = ?`, [{
        payment_date: paymentDate,
        paid_date: paymentDate,
        paid: true
      }, paymentId])
      return paymentId
    })
  }
}
