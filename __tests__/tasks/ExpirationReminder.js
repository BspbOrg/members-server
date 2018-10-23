// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const addDays = require('date-fns/add_days')
const format = require('date-fns/format')

const run = async () => (
  ah.api.specHelper.runTask('expirationReminder')
)

describe('task expirationReminder:run', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  beforeEach(async () => {
  })

  test('should start processMemberships', async () => {
    const spy = jest.spyOn(ah.api.expirationReminder, 'processMemberships')

    await run()

    expect(spy).toHaveBeenCalled()
  })

  test('should start processMemberships with correct from -to dates', async () => {
    const spy = jest.spyOn(ah.api.expirationReminder, 'processMemberships')

    const fromDate = format(addDays(new Date(), ah.api.config.expirationReminder.minDaysBeforeExpiration), 'YYYY-MM-DD')
    const toDate = format(addDays(new Date(), ah.api.config.expirationReminder.daysBeforeExpiration), 'YYYY-MM-DD')

    expect(spy).toHaveBeenCalledWith(fromDate, toDate)
  })
})
