const { api, Initializer } = require('actionhero')
const MembershipExpirationProcessor = require('../classes/MembershipExpirationProcessor')
const config = api.config.expiredReminder

module.exports = class ExpiredReminderScheduler extends Initializer {
  constructor () {
    super()
    this.name = 'expiredReminder'
  }

  initialize () {
    api.expiredReminder = new MembershipExpirationProcessor({ api, config })
  }

  async start () {
  }

  stop () {
  }
}
