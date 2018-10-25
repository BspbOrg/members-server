const { api, Initializer } = require('actionhero')
const MembershipExpirationProcessor = require('../classes/MembershipExpirationProcessor')

module.exports = class ExpirationReminderScheduler extends Initializer {
  constructor () {
    super()
    this.name = 'expiredReminder'
  }

  initialize () {
    const config = {
      minDays: api.config.expirationReminder.minDaysAfterExpired,
      days: api.config.expirationReminder.daysAfterExpired,
      emailTemplateName: api.config.expirationReminder.expiredMembershipEmailTemplate,
      emailSubject: api.config.expirationReminder.expiredMembershipEmailSubject
    }
    api.expiredReminder = new MembershipExpirationProcessor({ api, config: config })
  }
}
