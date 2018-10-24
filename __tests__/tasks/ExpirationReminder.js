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

describe('task expirationReminder:run validations', () => {
  const expectedError = Error('Values for minDaysBeforeExpiration and daysBeforeExpiration should be numbers greater or equal to zero')
  afterEach(ah.stop)

  test('should validate minDaysBeforeExpiration for string values', async () => {
    await ah.start({
      expirationReminder: (api) => {
        return {
          minDaysBeforeExpiration: 'some string'
        }
      }
    })

    await expect(ah.api.specHelper.runTask('expirationReminder')).rejects.toEqual(expectedError)
  })

  test('should validate minDaysBeforeExpiration for negative values', async () => {
    await ah.start({
      expirationReminder: (api) => {
        return {
          minDaysBeforeExpiration: -2
        }
      }
    })

    await expect(ah.api.specHelper.runTask('expirationReminder')).rejects.toEqual(expectedError)
  })

  test('should validate daysBeforeExpiration for string values', async () => {
    await ah.start({
      expirationReminder: (api) => {
        return {
          daysBeforeExpiration: 'some string'
        }
      }
    })

    await expect(ah.api.specHelper.runTask('expirationReminder')).rejects.toEqual(expectedError)
  })

  test('should validate daysBeforeExpiration for negative values', async () => {
    await ah.start({
      expirationReminder: (api) => {
        return {
          daysBeforeExpiration: -1
        }
      }
    })

    await expect(ah.api.specHelper.runTask('expirationReminder')).rejects.toEqual(expectedError)
  })
})
