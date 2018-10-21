const { api, Task } = require('actionhero')
const subDays = require('date-fns/sub_days')

module.exports = class ExpiredReminder extends Task {
  constructor () {
    super()
    this.name = 'expiredReminder'
    this.description = 'Sends reminder email to members when membership have expired'
    this.frequency = api.config.expiredReminder.frequency || 0
    this.queue = '*'
    this.middleware = []

    this.cursor = null
  }
  async run () {
    var now = new Date()
    var daysAfter = subDays(now, api.config.expiredReminder.daysAfterExpiration)
    api.log('Check for members with expired membership between ' + daysAfter + ' and ' + now, this.name)
    api.expiredReminder.processMemberships(daysAfter, now)
  }
}
