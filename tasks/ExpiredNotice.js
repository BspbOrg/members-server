const { api, Task } = require('actionhero')

module.exports = class ExpiredNotice extends Task {
  constructor () {
    super()
    this.name = 'ExpiredNotice'
    this.description = 'Sends reminder email to members when membership have expired'
    this.frequency = api.config.membership.expiredNotice.frequency
    this.queue = '*'
    this.middleware = []

    this.cursor = null
  }
  async run () {
    await api.membership.sendNoticeToExpired()
  }
}
