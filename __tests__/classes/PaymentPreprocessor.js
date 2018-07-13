// eslint-disable-next-line no-unused-vars
/* globals describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const processPayment = require('../../classes/PaymentPreprocessor')
const {generateMember, generatePayment} = require('../../test/generators')

describe('payments preprocessor', async () => {
  beforeAll(async () => {
    await ah.start()
    await ah.api.models.payment.destroy({where: {}, force: true})
    await ah.api.models.member.destroy({where: {}, force: true})
  })

  afterAll(ah.stop)

  afterEach(async () => {
    await ah.api.models.payment.destroy({where: {}, force: true})
    await ah.api.models.member.destroy({where: {}, force: true})
  })

  test('should add billing member in payment members when single payment is made', async () => {
    await ah.api.models.member.create(generateMember())
    const member2 = await ah.api.models.member.create(generateMember())
    const payment = generatePayment({
      billingMemberId: member2.id,
      membershipType: 'single'
    })
    delete payment.members
    const processed = await processPayment(payment)
    expect(processed.members.length).toBe(1)
    expect(processed.members[0]).toBe(member2.id)
  })

  test('should not add family members in payment members when single payment is made', async () => {
    await ah.api.models.member.create(generateMember())
    const billingMember = await ah.api.models.member.create(generateMember())
    const family1 = await ah.api.models.member.create(generateMember())
    const family2 = await ah.api.models.member.create(generateMember())
    await billingMember.setFamilyMembers([family1, family2])

    const payment = generatePayment({
      billingMemberId: billingMember.id,
      membershipType: 'single'
    })
    delete payment.members

    const processed = await processPayment(payment)
    expect(processed.members.length).toBe(1)
    expect(processed.members).toEqual(expect.arrayContaining([billingMember.id]))
  })

  test('should add billing member in payment members when family payment is made', async () => {
    await ah.api.models.member.create(generateMember())
    const billingMember = await ah.api.models.member.create(generateMember())
    const family1 = await ah.api.models.member.create(generateMember())
    const family2 = await ah.api.models.member.create(generateMember())
    await billingMember.setFamilyMembers([family1, family2])

    const payment = generatePayment({
      billingMemberId: billingMember.id,
      membershipType: 'family'
    })
    delete payment.members

    const processed = await processPayment(payment)
    expect(processed.members).toEqual(expect.arrayContaining([billingMember.id]))
  })

  test('should add family members in payment members when family payment is made', async () => {
    await ah.api.models.member.create(generateMember())
    const billingMember = await ah.api.models.member.create(generateMember())
    const family1 = await ah.api.models.member.create(generateMember())
    const family2 = await ah.api.models.member.create(generateMember())
    await billingMember.setFamilyMembers([family1, family2])

    const payment = generatePayment({
      billingMemberId: billingMember.id,
      membershipType: 'family',
      paymentDate: '2018-05-05'
    })
    delete payment.members

    const processed = await processPayment(payment)
    expect(processed.members).toEqual(expect.arrayContaining([family1.id, family2.id]))
  })

  test('should add only family members who became members before the payment date', async () => {
    await ah.api.models.member.create(generateMember())
    const billingMember = await ah.api.models.member.create(generateMember())
    const family1 = await ah.api.models.member.create(generateMember({membershipStartDate: '2015-10-15'}))
    const family2 = await ah.api.models.member.create(generateMember({membershipStartDate: '2015-10-20'}))
    await billingMember.setFamilyMembers([family1, family2])

    const payment = generatePayment({
      billingMemberId: billingMember.id,
      membershipType: 'family',
      paymentDate: '2015-10-18'
    })
    delete payment.members

    const processed = await processPayment(payment)
    expect(processed.members).toEqual(expect.arrayContaining([family1.id]))
    expect(processed.members).toEqual(expect.not.arrayContaining([family2.id]))
  })

  test('should fail when process family payment and billing member has no family', async () => {
    await ah.api.models.member.create(generateMember())
    const billingMember = await ah.api.models.member.create(generateMember())

    const payment = generatePayment({
      billingMemberId: billingMember.id,
      membershipType: 'family',
      paymentDate: '2018-05-05'
    })
    delete payment.members

    expect(processPayment(payment)).rejects.toThrowErrorMatchingSnapshot()
  })
})
