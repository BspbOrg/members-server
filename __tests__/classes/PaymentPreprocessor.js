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
    const member = await ah.api.models.member.create(generateMember())
    const payment = generatePayment({
      billingMemberId: member.id
    })

    const processed = await processPayment(payment)
    expect(processed.members).toEqual([member.id])
  })

  test('should add only related billing member in payment', async () => {
    // create member not related to the payment
    await ah.api.models.member.create(generateMember())

    const billingMember = await ah.api.models.member.create(generateMember())

    const payment = generatePayment({
      billingMemberId: billingMember.id
    })

    const processed = await processPayment(payment)
    expect(processed.members).toEqual([billingMember.id])
  })

  test('should add only related family member in payment', async () => {
    // create member not related to the payment
    const unrelatedMember = await ah.api.models.member.create(generateMember())

    const billingMember = await ah.api.models.member.create(generateMember())
    const familyMember = await ah.api.models.member.create(generateMember())
    await billingMember.setFamilyMembers([familyMember])

    const payment = generatePayment({
      billingMemberId: billingMember.id,
      isFamilyPayment: true
    })

    const processed = await processPayment(payment)
    expect(processed.members).toEqual(expect.not.arrayContaining([unrelatedMember.id]))
  })

  test('should not add family members in payment members when single payment is made', async () => {
    const billingMember = await ah.api.models.member.create(generateMember())
    const familyMember = await ah.api.models.member.create(generateMember())
    await billingMember.setFamilyMembers([familyMember])

    const payment = generatePayment({
      billingMemberId: billingMember.id,
      isFamilyPayment: false
    })

    const processed = await processPayment(payment)
    expect(processed.members).toEqual([billingMember.id])
  })

  test('should add billing member in payment members when family payment is made', async () => {
    const billingMember = await ah.api.models.member.create(generateMember())
    const familyMember = await ah.api.models.member.create(generateMember())
    await billingMember.setFamilyMembers([familyMember])

    const payment = generatePayment({
      billingMemberId: billingMember.id,
      isFamilyPayment: true
    })

    const processed = await processPayment(payment)
    expect(processed.members).toEqual(expect.arrayContaining([billingMember.id]))
  })

  test('should add family members in payment members when family payment is made', async () => {
    const billingMember = await ah.api.models.member.create(generateMember())
    const familyMember = await ah.api.models.member.create(generateMember())
    await billingMember.setFamilyMembers([familyMember])

    const payment = generatePayment({
      billingMemberId: billingMember.id,
      isFamilyPayment: true,
      paymentDate: '2018-05-05'
    })

    const processed = await processPayment(payment)
    expect(processed.members).toEqual(expect.arrayContaining([familyMember.id]))
  })

  test('should add family members who joined before payment date', async () => {
    const billingMember = await ah.api.models.member.create(generateMember())
    const familyMember = await ah.api.models.member.create(generateMember({membershipStartDate: '2015-10-15'}))
    await billingMember.setFamilyMembers([familyMember])

    const payment = generatePayment({
      billingMemberId: billingMember.id,
      isFamilyPayment: true,
      paymentDate: '2015-10-18'
    })

    const processed = await processPayment(payment)
    expect(processed.members).toEqual(expect.arrayContaining([familyMember.id]))
  })

  test('should not add family members who joined after payment date', async () => {
    const billingMember = await ah.api.models.member.create(generateMember())
    const familyMember = await ah.api.models.member.create(generateMember({membershipStartDate: '2015-10-20'}))
    await billingMember.setFamilyMembers([familyMember])

    const payment = generatePayment({
      billingMemberId: billingMember.id,
      isFamilyPayment: true,
      paymentDate: '2015-10-18'
    })

    const processed = await processPayment(payment)
    expect(processed.members).toEqual(expect.not.arrayContaining([familyMember.id]))
  })

  test('should add family members who joined on payment date', async () => {
    const billingMember = await ah.api.models.member.create(generateMember())
    const familyMember = await ah.api.models.member.create(generateMember({membershipStartDate: '2015-10-18'}))
    await billingMember.setFamilyMembers([familyMember])

    const payment = generatePayment({
      billingMemberId: billingMember.id,
      isFamilyPayment: true,
      paymentDate: '2015-10-18'
    })

    const processed = await processPayment(payment)
    expect(processed.members).toEqual(expect.arrayContaining([familyMember.id]))
  })

  test('should fail when process family payment and billing member has no family', async () => {
    const billingMember = await ah.api.models.member.create(generateMember())

    const payment = generatePayment({
      billingMemberId: billingMember.id,
      isFamilyPayment: true
    })

    expect(processPayment(payment)).rejects.toThrowErrorMatchingSnapshot()
  })
})
