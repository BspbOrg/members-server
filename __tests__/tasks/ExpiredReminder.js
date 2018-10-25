// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')

const run = async () => (
  ah.api.specHelper.runTask('expiredReminder')
)

describe('task expiredReminder:run', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  beforeEach(async () => {
  })

  test('should start processMemberships', async () => {
    ah.api.expiredReminder.remindExpired = jest.fn()

    await run()

    expect(ah.api.expiredReminder.remindExpired).toHaveBeenCalled()
  })
})
