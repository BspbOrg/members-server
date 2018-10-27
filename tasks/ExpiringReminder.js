const { api, Task } = require('actionhero')

module.exports = class ExpiringReminder extends Task {
  constructor () {
    super()
    this.name = 'expiringReminder'
    this.description = 'Sends reminder email to members for expiration'
    this.frequency = api.config.membership.expiringReminder.frequency
    this.queue = '*'
    this.middleware = []
  }

  async run () {
    await api.membership.sendReminderToExpiring()
  }
}
