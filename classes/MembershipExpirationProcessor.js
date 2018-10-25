const addDays = require('date-fns/add_days')
const format = require('date-fns/format')
const { Op, col } = require('sequelize')

module.exports = class MembershipExpirationProcessor {
  constructor ({ api, config }) {
    this.api = api
    this.config = config
    this.emailTemplateName = config.emailTemplateName
    this.emailSubject = config.emailSubject
  }

  async processMemberships (fromDate, toDate) {
    if (!(fromDate && toDate)) {
      throw new Error('Provide time period!')
    }

    const expiringMembership = await this.api.models.member.findAll({
      where: {
        membershipEndDate: { [Op.between]: [fromDate, toDate] },
        notifiedForExpiringDate: {
          [Op.or]: [
            { [Op.eq]: null },
            { [Op.ne]: col('membershipEndDate') }
          ]
        },
        email: { [Op.ne]: null }
      }
    })

    const results = expiringMembership.map(async (member) => {
      const [payment] = await this.api.models.payment.scopeMember(member.id).findAll({
        order: [['paymentDate', 'DESC']]
      })

      if (payment && payment.billingMemberId === member.id && payment.membershipType !== 'group') {
        this.api.log('Sending mail to member.id: ' + member.id)
        await this.enqueueSendMail(member)
        await member.update({ notifiedForExpiringDate: member.membershipEndDate })
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
    if (!MembershipExpirationProcessor.daysValid(this.config.minDaysBeforeExpiration) || !MembershipExpirationProcessor.daysValid(this.config.daysBeforeExpiration)) {
      throw new Error('Values for minDaysBeforeExpiration and daysBeforeExpiration should be numbers greater or equal to zero')
    }

    const now = addDays(new Date(), this.config.minDaysBeforeExpiration)
    const expiringDate = addDays(new Date(), this.config.daysBeforeExpiration)
    this.api.log(`Checking for members with expiring membership between ${format(now, 'YYYY-MM-DD')} and ${format(expiringDate, 'YYYY-MM-DD')}`, 'info')
    await this.processMemberships(now, expiringDate)
  }
}
