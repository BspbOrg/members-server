// eslint-disable-next-line no-unused-vars
/* globals describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')

describe('integration', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  // all tests use db restored from /test/files/bspborg.sql
  describe('bspb.org', () => {
    describe('fetch payments', () => {
      test('should return all records', async () => {
        const { rows } = await ah.api.integration.fetchPayments()
        expect(rows.length).toEqual(4)
      })

      test('should return cursor with last id', async () => {
        const { cursor } = await ah.api.integration.fetchPayments()
        expect(cursor).toEqual(expect.objectContaining({ id: 36 }))
      })

      test('should return cursor if not new records', async () => {
        const { cursor } = await ah.api.integration.fetchPayments({ cursor: { id: 12354 } })
        expect(cursor).toEqual(expect.objectContaining({ id: 12354 }))
      })

      test('should return only newer records', async () => {
        const { rows } = await ah.api.integration.fetchPayments({ cursor: { id: 5 } })
        expect(rows.length).toEqual(3)
      })

      test('should limit records', async () => {
        const { rows } = await ah.api.integration.fetchPayments({ limit: 1 })
        expect(rows.length).toEqual(1)
      })
    })

    describe('decodeBoricaMessage', function () {
      test('should validate signature', async () => {
        const { rows } = await ah.api.integration.fetchPayments({ limit: 1 })
        const decoded = await Promise.all(rows.map(row => ah.api.integration.decodeBoricaMessage(row.rawData)))
        expect(decoded).toEqual(expect.arrayContaining([expect.objectContaining({ valid: false })]))
      })

      test('should validate response code', async () => {
        const { rows } = await ah.api.integration.fetchPayments({ cursor: { id: 9 }, limit: 1 })
        const decoded = await Promise.all(rows.map(row => ah.api.integration.decodeBoricaMessage(row.rawData)))
        expect(decoded).toEqual(expect.arrayContaining([expect.objectContaining({ success: false })]))
      })

      test('should decode payment id', async () => {
        const { rows } = await ah.api.integration.fetchPayments({ cursor: { id: 7 }, limit: 1 })
        const decoded = await Promise.all(rows.map(row => ah.api.integration.decodeBoricaMessage(row.rawData)))
        expect(decoded).toEqual(expect.arrayContaining([expect.objectContaining({ paymentId: '1286' })]))
      })
    })

    describe('fetchPaymentMembers', () => {
      test('should resolve paymentId', async () => {
        const [{ username }] = await ah.api.integration.fetchPaymentMembers(['1286'])
        expect(username).toEqual('user1')
      })

      test('should skip invalid paymentId', async () => {
        const res = await ah.api.integration.fetchPaymentMembers(['NO ID'])
        expect(res).toEqual([])
      })
    })

    describe('getPaymentsForSync', () => {
      test('should return', async () => {
        const response = await ah.api.integration.getPaymentsForSync()
        expect(response).toMatchSnapshot()
      })
    })

    describe('createOrUpdateMembershipPayment', () => {
      const run = async ({ username, paymentDate = '2018-09-30', ...args }) => ah.api.integration.createOrUpdateMembershipPayment({
        username,
        paymentDate,
        ...args
      })
      const fetchSystemPayments = async (username) => ah.api.integration.perform(async (conn) => conn.query(`
        SELECT m.username, h.name, payment_date as 'paymentDate', paid_date as 'paidDate', paid 
        FROM members_history h
        JOIN members m on (h.member_id = m.id)
        WHERE m.username = ? AND h.name = ?
        ORDER BY h.id DESC
      `, [username, ah.api.integration.systemPaymentName]))

      const deleteSystemPayments = async () => ah.api.integration.perform(async (conn) => conn.query(
        'DELETE FROM members_history WHERE name = ?',
        [ah.api.integration.systemPaymentName]
      ))

      beforeEach(async () => {
        await deleteSystemPayments()
      })

      afterEach(async () => {
        await deleteSystemPayments()
      })

      test('should create system payment for the user', async () => {
        await run({ username: 'user1' })
        const [rows] = await fetchSystemPayments('user1')
        expect(rows).toHaveLength(1)
      })

      test('should create system payment at the date', async () => {
        await run({ username: 'user1', paymentDate: '2018-10-01' })
        const [[{ paymentDate }]] = await fetchSystemPayments('user1')
        expect(paymentDate).toBeDate('2018-10-01')
      })

      test('member should have only one system payment record', async () => {
        await run({ username: 'user1' })
        await run({ username: 'user1' })
        const [rows] = await fetchSystemPayments('user1')
        expect(rows).toHaveLength(1)
      })

      test('should update payment date', async () => {
        await run({ username: 'user1', paymentDate: '2018-01-01' })
        await run({ username: 'user1', paymentDate: '2018-09-30' })
        const [[{ paymentDate }]] = await fetchSystemPayments('user1')
        expect(paymentDate).toBeDate('2018-09-30')
      })

      test('should delete system payment', async () => {
        await run({ username: 'user1' })
        await run({ username: 'user1', paymentDate: null })
        const [rows] = await fetchSystemPayments('user1')
        expect(rows).toHaveLength(0)
      })
    })
  })
})
