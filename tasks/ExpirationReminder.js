const { api, Task } = require('actionhero')

module.exports = class ExpirationReminder extends Task {
  constructor () {
    super()
    this.name = 'expirationReminder'
    this.description = 'Sends reminder email to members for expiration'
    this.frequency = api.config.expirationReminder.frequency
    this.queue = '*'
    this.middleware = []
  }

  async run () {
    await api.expirationReminder.remindExpiring()
  }
}
