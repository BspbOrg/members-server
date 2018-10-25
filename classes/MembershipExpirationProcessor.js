const addDays = require('date-fns/add_days')
const subDays = require('date-fns/sub_days')
const format = require('date-fns/format')
const { Op, col } = require('sequelize')

module.exports = class MembershipExpirationProcessor {
  constructor ({ api, config }) {
    this.api = api
    this.config = { ...config }
    this.emailTemplateName = config.emailTemplateName
    this.emailSubject = config.emailSubject
  }

  async processMemberships (fromDate, toDate, memberCheckFlagFieldName) {
    if (!(fromDate && toDate)) {
      throw new Error('Provide time period!')
    }

    const whereClause = {
      membershipEndDate: { [Op.between]: [fromDate, toDate] },
      email: { [Op.ne]: null }
    }
    whereClause[memberCheckFlagFieldName] = {
      [Op.or]: [
        { [Op.eq]: null },
        { [Op.ne]: col('membershipEndDate') }
      ]
    }
    // Well ... this is ugly
    const expiringMembership = await this.api.models.member.findAll({
      where: whereClause
    })

    const results = expiringMembership.map(async (member) => {
      const [payment] = await this.api.models.payment.scopeMember(member.id).findAll({
        order: [['paymentDate', 'DESC']]
      })

      if (payment && payment.billingMemberId === member.id && payment.membershipType !== 'group') {
        this.api.log('Sending mail to member.id: ' + member.id)
        await this.enqueueSendMail(member)
        const flagUpdateObj = {}
        Object.defineProperty(flagUpdateObj, memberCheckFlagFieldName, {
          value: member.membershipEndDate, writable: true, enumerable: true
        })
        await member.update(flagUpdateObj)
      }
    })

    return Promise.all(results)
  }

  async enqueueSendMail (member) {
    return this.api.tasks.enqueue('sendmail',
      {
        template: this.emailTemplateName,
        mail: {
          to: member.email,
          subject: this.emailSubject
        },
        locals: { name: member.name, membershipEndDate: member.membershipEndDate }
      })
  }

  static daysValid (days) { return !(typeof days !== 'number' || days < 0) }

  async remindExpiring () {
    if (!MembershipExpirationProcessor.daysValid(this.config.minDays) || !MembershipExpirationProcessor.daysValid(this.config.days)) {
      throw new Error('Values for minDaysBeforeExpiration and daysBeforeExpiration should be numbers greater or equal to zero')
    }

    const now = addDays(new Date(), this.config.minDays)
    const expiringDate = addDays(new Date(), this.config.days)
    this.api.log(`Checking for members with expiring membership between ${format(now, 'YYYY-MM-DD')} and ${format(expiringDate, 'YYYY-MM-DD')}`, 'info')
    await this.processMemberships(now, expiringDate, 'notifiedForExpiringDate')
  }

  async remindExpired () {
    if (!MembershipExpirationProcessor.daysValid(this.config.minDays) || !MembershipExpirationProcessor.daysValid(this.config.days)) {
      throw new Error('Values for minDaysAfterExpired and daysAfterExpired should be numbers greater or equal to zero')
    }

    const now = subDays(new Date(), this.config.minDays)
    const earliestExpiringDate = subDays(new Date(), this.config.days)
    this.api.log(`Checking for members with expired membership between ${format(earliestExpiringDate, 'YYYY-MM-DD')} and ${format(now, 'YYYY-MM-DD')}`, 'info')
    await this.processMemberships(earliestExpiringDate, now)
  }
}
