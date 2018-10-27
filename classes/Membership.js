const addDays = require('date-fns/add_days')
const subDays = require('date-fns/sub_days')
const format = require('date-fns/format')
const addYears = require('date-fns/add_years')
const isAfter = require('date-fns/is_after')
const compareAsc = require('date-fns/compare_asc')
const { Op, col } = require('sequelize')

module.exports = class Membership {
  constructor ({ api, config }) {
    this.api = api
    this.config = config
  }

  static daysValid (days) { return !(typeof days !== 'number' || days < 0) }

  static validateReminderNoticeConfiguration ({ minDays, maxDays }) {
    const days = { minDays, maxDays }
    Object.entries(days).forEach(([key, value]) => {
      if (!Membership.daysValid(value)) {
        throw new Error(`Invalid value for ${key}. Must be a positive number`)
      }
    })
  }

  /**
   *
   * @param {Payment[]}payments
   */
  computeMembership (payments) {
    let startDate
    let endDate
    let firstDate
    payments = payments.sort(({ paymentDate: a }, { paymentDate: b }) => compareAsc(a, b))
    for (let payment of payments) {
      if (!firstDate) firstDate = payment.paymentDate
      if (!endDate || isAfter(payment.paymentDate, endDate)) {
        // membership expired or we started new one
        startDate = payment.paymentDate
        endDate = addYears(startDate, 1 /* year */)
      } else {
        // we have payment before membership has expired
        endDate = addYears(endDate, 1 /* year */)
      }
    }
    return { startDate, endDate, firstDate }
  }

  async findExpiringPayingMembers (fromDate, toDate, memberCheckFlagFieldName) {
    if (!fromDate) {
      throw new Error('Missing fromDate')
    }
    if (!toDate) {
      throw new Error('Missing toDate')
    }
    if (!memberCheckFlagFieldName) {
      throw new Error('Missing memberCheckFlagFieldName')
    }

    const members = await this.api.models.member.findAll({
      where: {
        membershipEndDate: { [Op.between]: [fromDate, toDate] },
        email: { [Op.ne]: null },
        [memberCheckFlagFieldName]: {
          [Op.or]: [
            { [Op.eq]: null },
            { [Op.ne]: col('membershipEndDate') }
          ]
        }
      }
    })

    const payingMembers = await Promise.all(members.map(async (member) => {
      const { id: memberId } = member
      const [{ billingMemberId, membershipType } = {}] = await this.api.models.payment.scopeMember(memberId).findAll({
        order: [['paymentDate', 'DESC']]
      })
      if (billingMemberId === memberId && membershipType !== 'group') {
        return member
      }
    }))

    return payingMembers.filter(m => m)
  }

  async sendReminder (config, fromDate, toDate, field) {
    const members = await this.findExpiringPayingMembers(fromDate, toDate, field)
    await this.enqueueEmail(members, { subject: config.emailSubject })
    return Promise.all(members.map(async (member) => member.updateAttributes({ [field]: member.membershipEndDate })))
  }

  async sendReminderToExpiring () {
    const config = this.config.expiringReminder
    Membership.validateReminderNoticeConfiguration(config)

    const fromDate = addDays(new Date(), config.minDays)
    const toDate = addDays(new Date(), config.maxDays)
    this.api.log(`Checking for members with expiring membership between ${format(fromDate, 'YYYY-MM-DD')} and ${format(toDate, 'YYYY-MM-DD')}`, 'info')

    return this.sendReminder(config, fromDate, toDate, 'notifiedForExpiringDate')
  }

  async sendNoticeToExpired () {
    const config = this.config.expiredNotice
    Membership.validateReminderNoticeConfiguration(config)

    const fromDate = subDays(new Date(), config.maxDays)
    const toDate = subDays(new Date(), config.minDays)
    this.api.log(`Checking for members with expired membership between ${format(fromDate, 'YYYY-MM-DD')} and ${format(toDate, 'YYYY-MM-DD')}`, 'info')

    return this.sendReminder(config, fromDate, toDate, 'notifiedForExpiredDate')
  }

  async enqueueRecompute (members) {
    return Promise.all(
      members.map(
        member => this.api.tasks.enqueue(
          'membership:recompute',
          { memberId: member.id || member }
        )
      )
    )
  }

  async enqueueEmail (members, { subject, locals, ...opts }) {
    return Promise.all(
      members.map(
        member => this.api.tasks.enqueue(
          'sendmail',
          {
            mail: {
              to: member.email,
              subject
            },
            locals: { ...member.toJSON('email'), memberId: member.id, ...locals },
            ...opts
          }
        )
      )
    )
  }
}
