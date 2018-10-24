const { api, Task } = require('actionhero')
const addDays = require('date-fns/add_days')
const format = require('date-fns/format')

module.exports = class ExpirationReminder extends Task {
  constructor () {
    super()
    this.name = 'expirationReminder'
    this.description = 'Sends reminder email to members for expiration'
    this.frequency = api.config.expirationReminder.frequency
    this.queue = '*'
    this.middleware = []

    this.cursor = null
  }
  async run () {
    if (!(this.validateConfigDays(api.config.expirationReminder.minDaysBeforeExpiration) &&
      this.validateConfigDays(api.config.expirationReminder.daysBeforeExpiration))) {
      throw new Error('Values for minDaysBeforeExpiration and daysBeforeExpiration should be numbers greater or equal to zero')
    }

    const now = format(addDays(new Date(), api.config.expirationReminder.minDaysBeforeExpiration), 'YYYY-MM-DD')
    const expiringDate = format(addDays(new Date(), api.config.expirationReminder.daysBeforeExpiration), 'YYYY-MM-DD')
    api.log('Check for members with expiring membership between ' + now + ' and ' + expiringDate, this.name)
    api.expirationReminder.processMemberships(now, expiringDate)
  }

  validateConfigDays (days) {
    if (typeof days !== 'number' || days < 0) {
      return false
    }
    return true
  }
}
