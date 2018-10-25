const { api, Task } = require('actionhero')

module.exports = class ExpiredReminder extends Task {
  constructor () {
    super()
    this.name = 'expiredReminder'
    this.description = 'Sends reminder email to members when membership have expired'
    this.frequency = api.config.expirationReminder.expiredReminderFrequency
    this.queue = '*'
    this.middleware = []

    this.cursor = null
  }
  async run () {
    await api.expiredReminder.remindExpired()
  }
}
