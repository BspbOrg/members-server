// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const { generateMember } = require('../../test/generators')

const run = () => (
  ah.api.specHelper.runTask('ImportBoricaPayments')
)

describe('task ImportBoricaPayments', () => {
  let member1

  beforeAll(ah.start)
  afterAll(ah.stop)

  beforeEach(async () => {
    await ah.api.models.payment.truncate({ force: true })
    member1 = await ah.api.models.member.create(generateMember({ username: 'user1' }))
  })

  afterEach(async () => {
    await ah.api.models.payment.truncate({ force: true })
    await member1.destroy({ force: true })
  })

  test('should clear payments', async () => {
    const payment = await ah.api.models.payment.findOne()
    expect(payment).toBeFalsy()
  })

  test('should create payments', async () => {
    await run()
    const payment = await ah.api.models.payment.findOne()
    expect(payment).toBeTruthy()
  })

  test('should not duplicate payments', async () => {
    await run()
    const countBefore = await ah.api.models.payment.count()
    await run()
    const countAfter = await ah.api.models.payment.count()
    expect(countAfter).toEqual(countBefore)
  })
})
