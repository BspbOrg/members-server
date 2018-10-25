const { api, Initializer } = require('actionhero')
const MembershipExpirationProcessor = require('../classes/MembershipExpirationProcessor')

module.exports = class ExpirationReminderScheduler extends Initializer {
  constructor () {
    super()
    this.name = 'expirationReminder'
  }

  initialize () {
    api.expirationReminder = new MembershipExpirationProcessor({ api, config: api.config.expirationReminder })
  }
}
