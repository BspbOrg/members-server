const { api, Task } = require('actionhero')
const addDays = require('date-fns/add_days')
const format = require('date-fns/format')

const daysValid = days => !(typeof days !== 'number' || days < 0)

module.exports = class ExpirationReminder extends Task {
  constructor () {
    super()
    this.config = api.config.expirationReminder

    this.name = 'expirationReminder'
    this.description = 'Sends reminder email to members for expiration'
    this.frequency = this.config.frequency
    this.queue = '*'
    this.middleware = []

    this.cursor = null
  }

  async run () {
    if (!daysValid(this.config.minDaysBeforeExpiration) || !daysValid(this.config.daysBeforeExpiration)) {
      throw new Error('Values for minDaysBeforeExpiration and daysBeforeExpiration should be numbers greater or equal to zero')
    }

    const now = addDays(new Date(), this.config.minDaysBeforeExpiration)
    const expiringDate = addDays(new Date(), this.config.daysBeforeExpiration)
    api.log(`Check for members with expiring membership between ${format(now, 'YYYY-MM-DD')} and ${format(expiringDate, 'YYYY-MM-DD')}`, 'info')
    await api.expirationReminder.processMemberships(now, expiringDate)
  }
}
