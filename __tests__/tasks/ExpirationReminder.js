// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const addDays = require('date-fns/add_days')

const setup = async (config) => {
  await ah.start(config)
  ah.api.expirationReminder.processMemberships = jest.fn()
  return ah.api.expirationReminder.processMemberships
}

const run = () => ah.api.specHelper.runTask('expirationReminder')

describe('task expirationReminder', () => {
  afterEach(async () => {
    // need to wait a little, because quickly booting and shutting down actionhero leads to strange errors
    await new Promise(resolve => setTimeout(resolve, 500))

    await ah.stop()
  })

  test('should start processMemberships', async () => {
    const mockProcess = await setup()

    await run()

    expect(mockProcess).toHaveBeenCalled()
  })

  test('should pass correct from and to dates', async () => {
    const mockProcess = await setup({
      expirationReminder: {
        minDaysBeforeExpiration: 10,
        daysBeforeExpiration: 20
      }
    })

    const fromDate = addDays(new Date(), 10)
    const toDate = addDays(new Date(), 20)

    await run()

    expect(mockProcess).toHaveBeenCalledWith(fromDate, toDate)
  })

  test('should validate minDaysBeforeExpiration for string values', async () => {
    await setup({
      expirationReminder: {
        minDaysBeforeExpiration: 'some string'
      }
    })

    await expect(run()).rejects.toMatchSnapshot()
  })

  test('should validate minDaysBeforeExpiration for negative values', async () => {
    await setup({
      expirationReminder: {
        minDaysBeforeExpiration: -2
      }
    })

    await expect(run()).rejects.toMatchSnapshot()
  })

  test('should validate daysBeforeExpiration for string values', async () => {
    await setup({
      expirationReminder: {
        daysBeforeExpiration: 'some string'
      }
    })

    await expect(run()).rejects.toMatchSnapshot()
  })

  test('should validate daysBeforeExpiration for negative values', async () => {
    await setup({
      expirationReminder: {
        daysBeforeExpiration: -1
      }
    })

    await expect(run()).rejects.toMatchSnapshot()
  })
})
