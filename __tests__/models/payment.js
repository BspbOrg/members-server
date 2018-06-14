// eslint-disable-next-line no-unused-vars
/* globals describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const { generatePayment, generateMember } = require('../../test/generators')
const { testRequiredFields } = require('../../test/helpers')

describe('model payment', () => {
  beforeAll(async () => {
    await ah.start()
    // await ah.api.sequelize.sequelize.sync({logging: ah.api.log})
    await ah.api.models.payment.destroy({ where: {}, force: true })
  })
  afterAll(ah.stop)

  test('should begin with no users', async () => {
    expect.assertions(1)
    await expect(ah.api.models.payment.findAll()).resolves.toHaveLength(0)
  })

  describe('creating', () => {
    let payment
    beforeEach(() => {
      payment = generatePayment()
    })

    testRequiredFields('payment', () => payment, [ 'paymentDate', 'amount', 'billingMemberId' ])

    test('should properly store currency amount', async () => {
      payment.amount = 1.23
      payment = await ah.api.models.payment.create(payment)
      await payment.reload()
      expect(payment.amount).toBe(1.23)
    })

    test('should not allow amount=0', async () => {
      payment.amount = 0
      return expect(ah.api.models.payment.create(payment)).rejects.toThrowErrorMatchingSnapshot()
    })

    test('should not allow negative amount', async () => {
      payment.amount = -1
      return expect(ah.api.models.payment.create(payment)).rejects.toThrowErrorMatchingSnapshot()
    })
  })

  describe('with some payments', () => {
    let member1
    let member2
    let payment1
    let payment2
    beforeAll(async () => {
      member1 = await ah.api.models.member.create(generateMember())
      member2 = await ah.api.models.member.create(generateMember())
      payment1 = await ah.api.models.payment.create(generatePayment({
        billingMemberId: member1.id
      }))
      payment2 = await ah.api.models.payment.create(generatePayment({
        billingMemberId: member2.id
      }))
      await payment2.setMembers([ member1, member2 ])
    })
    afterAll(async () => {
      payment1.destroy({ force: true })
      payment2.destroy({ force: true })
      member1.destroy({ force: true })
      member2.destroy({ force: true })
    })

    test('should have billingMember association', async () => {
      const billingMember = await payment1.getBillingMember()
      expect(billingMember).toEqual(expect.objectContaining({ id: member1.id }))
    })

    test('should have members association', async () => {
      const members = await payment2.getMembers()
      expect(members).toEqual(expect.arrayContaining([ expect.objectContaining({ id: member1.id }) ]))
    })

    test('member scope should include billing member', async () => {
      const payments = await ah.api.models.payment.scopeMember(member1.id).findAll({})
      expect(payments).toEqual(expect.arrayContaining([ expect.objectContaining({ id: payment1.id }) ]))
    })

    test('member scope should include members', async () => {
      const payments = await ah.api.models.payment.scopeMember(member1.id).findAll({})
      expect(payments).toEqual(expect.arrayContaining([ expect.objectContaining({ id: payment2.id }) ]))
    })

    test('member scope should not duplicate', async () => {
      const payments = await ah.api.models.payment.scopeMember(member1.id).findAll({})
      expect(payments).toHaveLength(2)
    })
  })
})
