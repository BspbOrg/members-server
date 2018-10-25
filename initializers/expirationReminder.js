const { api, Initializer } = require('actionhero')
const MembershipExpirationProcessor = require('../classes/MembershipExpirationProcessor')

module.exports = class ExpirationReminderScheduler extends Initializer {
  constructor () {
    super()
    this.name = 'expirationReminder'
  }

  initialize () {
    const config = {
      minDays: api.config.expirationReminder.minDaysBeforeExpiration,
      days: api.config.expirationReminder.daysBeforeExpiration,
      emailTemplateName: api.config.expirationReminder.emailTemplateName,
      emailSubject: api.config.expirationReminder.emailSubject
    }
    api.expirationReminder = new MembershipExpirationProcessor({ api, config: config })
  }
}
