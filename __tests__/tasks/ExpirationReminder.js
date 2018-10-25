// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')

const run = () => ah.api.specHelper.runTask('expirationReminder')

describe('task expirationReminder', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  test('should start processMemberships', async () => {
    ah.api.expirationReminder.remindExpiring = jest.fn()

    await run()

    expect(ah.api.expirationReminder.remindExpiring).toHaveBeenCalled()
  })
})
