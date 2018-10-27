// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')

const run = () => ah.api.specHelper.runTask('expiringReminder')

describe('task expiringReminder', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  test('should start sendReminderToExpiring', async () => {
    ah.api.membership.sendReminderToExpiring = jest.fn()

    await run()

    expect(ah.api.membership.sendReminderToExpiring).toHaveBeenCalled()
  })
})
