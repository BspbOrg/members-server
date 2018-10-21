const { Op } = require('sequelize')

module.exports = class MembershipExpirationProcessor {
  constructor ({ api, config }) {
    this.api = api
    this.daysBeforeExpiration = config.daysBeforeExpiration
    this.emailTemplateName = config.emailTemplateName
    this.emailSubject = config.emailSubject
    this.timeInDay = 1000 * 60 * 60 * 24
  }

  async processMemberships (fromDate, toDate) {
    if (!(fromDate && toDate)) {
      return new Error('Provide time period!')
    }

    var exipiringMemberships = await this.api.models.member.findAll({
      where: { membershipEndDate: { [Op.between]: [fromDate, toDate] } }
    })

    var results = exipiringMemberships.map(async (member) => {
      var payments = await this.api.models.payment.findAll({
        order: [
          ['paymentDate', 'DESC']
        ],
        where: { billingMemberId: { [Op.eq]: member.id } }
      })

      if (payments && payments[0] && payments[0].paymentType !== 'group') {
        this.api.log('Sending mail to member.id: ' + member.id)
        await this.enqueueSendMail(member)
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
        locals: { name: member.name }
      })
  }
}
