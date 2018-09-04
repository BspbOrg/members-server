// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const { generateMember, generatePayment } = require('../../test/generators')

const prepare = async (
  {
    memberId = 1,
    payments = [{ paymentDate: '2018-09-03' }]
  } = {}) => {
  payments = payments.map(payment => ({
    billingMemberId: memberId,
    members: [memberId],
    ...payment
  }))
  const membersHash = { [memberId]: true }
  payments.forEach(({ billingMemberId, members }) => {
    membersHash[billingMemberId] = true
    // eslint-disable-next-line no-return-assign
    members.forEach(memberId => membersHash[memberId] = true)
  })
  const members = Object.keys(membersHash).map(id => +id)

  const memberModels = await Promise.all(
    members.map(
      async (memberId) => {
        const model = ah.api.models.member.create(
          generateMember({ id: memberId })
        )
        membersHash[memberId] = model
        return model
      }
    )
  )
  const paymentModels = await Promise.all(
    payments.map(
      payment => ah.api.models.payment.create(
        generatePayment(payment)
      )
    )
  )
  return { membersHash, members: memberModels, payments: paymentModels }
}

const run = ({ memberId = 1, ...paramsOverride } = {}) => (
  ah.api.specHelper.runTask('membership:recompute', {
    memberId,
    ...paramsOverride
  })
)

describe('task membership:recompute', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  beforeEach(async () => {
    await ah.api.models.payment.truncate({ force: true })
    await ah.api.models.member.truncate({ force: true })
  })

  test('should update membership', async () => {
    const { members: [member] } = await prepare({ memberId: 1, payments: [{ paymentDate: '2018-09-03' }] })
    await run({ memberId: 1 })
    await member.reload()
    expect(member.membershipStartDate).toEqual('2018-09-03')
    expect(member.membershipEndDate).toEqual('2019-09-03')
  })

  test('should include only payments with member', async () => {
    const { members: [member] } = await prepare({
      memberId: 1,
      payments: [
        { paymentDate: '2018-09-03' },
        { paymentDate: '2018-09-01', members: [2] }
      ]
    })
    await run({ memberId: 1 })
    await member.reload()
    expect(member.membershipStartDate).toEqual('2018-09-03')
    expect(member.membershipEndDate).toEqual('2019-09-03')
  })
})
