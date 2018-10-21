const { api, Task } = require('actionhero')
const addDays = require('date-fns/add_days')

module.exports = class ExpirationReminder extends Task {
  constructor () {
    super()
    this.name = 'expirationReminder'
    this.description = 'Sends reminder email to members for expiration'
    this.frequency = api.config.expirationReminder.frequency || 0
    this.queue = '*'
    this.middleware = []

    this.cursor = null
  }
  async run () {
    var now = new Date()
    var expiringDate = addDays(now, api.config.expirationReminder.daysBeforeExpiration)
    api.log('Check for members with expiring membership between ' + now + ' and ' + expiringDate, this.name)
    api.expirationReminder.processMemberships(now, expiringDate)
  }
}
