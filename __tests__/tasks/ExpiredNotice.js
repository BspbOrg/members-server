// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')

const run = async () => (
  ah.api.specHelper.runTask('expiredNotice')
)

describe('task expiredNotice:run', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  beforeEach(async () => {
  })

  test('should start sendNoticeToExpired', async () => {
    ah.api.membership.sendNoticeToExpired = jest.fn()

    await run()

    expect(ah.api.membership.sendNoticeToExpired).toHaveBeenCalled()
  })
})
