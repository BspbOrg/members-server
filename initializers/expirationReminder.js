const { api, Initializer } = require('actionhero')
const MembershipExpirationProcessor = require('../classes/MembershipExpirationProcessor')

module.exports = class ExpirationReminderScheduler extends Initializer {
  constructor () {
    super()
    this.name = 'expirationReminder'
  }

  initialize () {
    const expirationReminderConfig = {
      minDays: api.config.expirationReminder.minDaysBeforeExpiration,
      days: api.config.expirationReminder.daysBeforeExpiration,
      emailTemplateName: api.config.expirationReminder.emailTemplateName,
      emailSubject: api.config.expirationReminder.emailSubject
    }
    api.expirationReminder = new MembershipExpirationProcessor({ api, config: expirationReminderConfig })

    const expiredReminderConfig = {
      minDays: api.config.expirationReminder.minDaysAfterExpired,
      days: api.config.expirationReminder.daysAfterExpired,
      emailTemplateName: api.config.expirationReminder.expiredMembershipEmailTemplate,
      emailSubject: api.config.expirationReminder.expiredMembershipEmailSubject
    }
    api.expiredReminder = new MembershipExpirationProcessor({ api, config: expiredReminderConfig })
  }
}
