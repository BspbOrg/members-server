// eslint-disable-next-line no-unused-vars
/* global jest, describe, test, expect, jest, beforeEach, afterEach, beforeAll, afterAll */

const ah = require('../../test/ah-setup')
const MembershipExpirationProcessor = require('../../classes/MembershipExpirationProcessor')
const { generateMember, generatePayment } = require('../../test/generators')
const addDays = require('date-fns/add_days')
const subDays = require('date-fns/sub_days')

const fromDate = new Date()

const generateMemberWithEmail = async (memberOpts = {}) => {
  const generatedMember = generateMember({ ...memberOpts })
  if (!generatedMember.email) {
    generatedMember.email = `member.${generatedMember.cardId}@bspb.org`
  }
  const member = await ah.api.models.member.create(generatedMember)
  return member
}
const generateMemberAndPayment = async ({ memberOpts = {}, paymentOps = {} }) => {
  const member = await generateMemberWithEmail(memberOpts)
  const payment = await ah.api.models.payment.create(generatePayment({
    billingMemberId: member.id,
    members: [member.id],
    ...paymentOps
  }))
  return { member, payment }
}

const setup = () => {
  const processor = new MembershipExpirationProcessor({
    api: ah.api,
    config: {
      daysBeforeExpiration: 30,
      emailTemplateName: ''
    }
  })
  const sendMailSpy = jest.spyOn(processor, 'enqueueSendMail')
  return { processor, sendMailSpy }
}

describe('MembershipExpiration', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  const testProcessMemberships = (memberCheckFlagFieldName) => {
    describe(`processing memberships for ${memberCheckFlagFieldName}`, () => {
      beforeEach(async () => {
        await ah.api.models.payment.destroy({ where: {}, force: true })
        await ah.api.models.member.destroy({ where: {}, force: true })
      })

      test('notify expiring member with email', async () => {
        const { processor, sendMailSpy } = setup()

        const { member } = await generateMemberAndPayment({
          memberOpts: { membershipEndDate: addDays(fromDate, 27) }
        })

        await processor.processMemberships(fromDate, addDays(fromDate, 30), memberCheckFlagFieldName)

        expect(sendMailSpy).toHaveBeenCalledWith(expect.objectContaining({ id: member.id }))
      })

      test('do not notify members outside interval', async () => {
        const { processor, sendMailSpy } = setup()

        await generateMemberAndPayment({
          memberOpts: { membershipEndDate: addDays(fromDate, 31) }
        })

        await processor.processMemberships(fromDate, addDays(fromDate, 30), memberCheckFlagFieldName)

        expect(sendMailSpy).not.toHaveBeenCalled()
      })

      test('record expiration date', async () => {
        const { processor } = setup()

        const { member } = await generateMemberAndPayment({
          memberOpts: { membershipEndDate: addDays(fromDate, 27) }
        })

        const { membershipEndDate } = member
        expect(member.notifiedForExpiringDate).not.toEqual(membershipEndDate)

        await processor.processMemberships(fromDate, addDays(fromDate, 30), memberCheckFlagFieldName)
        await member.reload()

        expect(member[memberCheckFlagFieldName]).toEqual(membershipEndDate)
      })

      test('skip already notified', async () => {
        const { processor, sendMailSpy } = setup()

        const membershipEndDate = addDays(fromDate, 27)

        await generateMemberAndPayment({
          memberOpts: {
            membershipEndDate,
            [memberCheckFlagFieldName]: membershipEndDate
          }
        })

        await processor.processMemberships(fromDate, addDays(fromDate, 30), memberCheckFlagFieldName)

        expect(sendMailSpy).not.toHaveBeenCalled()
      })

      test('skip members when group membership', async () => {
        const { processor, sendMailSpy } = setup()

        await generateMemberAndPayment({
          memberOpts: { membershipEndDate: addDays(fromDate, 27) },
          paymentOps: { membershipType: 'group' }
        })

        await processor.processMemberships(fromDate, addDays(fromDate, 30), memberCheckFlagFieldName)

        expect(sendMailSpy).not.toHaveBeenCalled()
      })

      test('skip members who are not billing member', async () => {
        const { processor, sendMailSpy } = setup()

        const member = await generateMemberWithEmail({
          membershipEndDate: addDays(fromDate, 27)
        })
        const billingMember = await generateMemberWithEmail({
          membershipEndDate: addDays(fromDate, 27)
        })
        await ah.api.models.payment.create(generatePayment({
          billingMemberId: billingMember.id,
          members: [billingMember.id, member.id]
        }))

        await processor.processMemberships(fromDate, addDays(fromDate, 30), memberCheckFlagFieldName)

        expect(sendMailSpy).not.toHaveBeenCalledWith(expect.objectContaining({ id: member.id }))
      })

      test('skip members who have no payments', async () => {
        const { processor, sendMailSpy } = setup()

        await generateMemberWithEmail({
          membershipEndDate: addDays(fromDate, 27)
        })

        await processor.processMemberships(fromDate, addDays(fromDate, 30), memberCheckFlagFieldName)

        expect(sendMailSpy).not.toHaveBeenCalled()
      })

      test('skip members with older regular membership and newer group membership', async () => {
        const { processor, sendMailSpy } = setup()

        const member = await generateMemberWithEmail({
          membershipEndDate: addDays(fromDate, 27)
        })

        // older payment
        await ah.api.models.payment.create(generatePayment({
          billingMemberId: member.id,
          members: [member.id],
          paymentDate: subDays(fromDate, 20),
          membershipType: 'regular'
        }))

        // newer payment
        await ah.api.models.payment.create(generatePayment({
          billingMemberId: member.id,
          members: [member.id],
          paymentDate: subDays(fromDate, 10),
          membershipType: 'group'
        }))

        await processor.processMemberships(fromDate, addDays(fromDate, 30), memberCheckFlagFieldName)

        expect(sendMailSpy).not.toHaveBeenCalled()
      })

      test('notify members with newer regular membership and older group membership', async () => {
        const { processor, sendMailSpy } = setup()

        const member = await generateMemberWithEmail({
          membershipEndDate: addDays(fromDate, 27)
        })

        // older payment
        await ah.api.models.payment.create(generatePayment({
          billingMemberId: member.id,
          members: [member.id],
          paymentDate: subDays(fromDate, 20),
          membershipType: 'group'
        }))

        // newer payment
        await ah.api.models.payment.create(generatePayment({
          billingMemberId: member.id,
          members: [member.id],
          paymentDate: subDays(fromDate, 10),
          membershipType: 'regular'
        }))

        await processor.processMemberships(fromDate, addDays(fromDate, 30), memberCheckFlagFieldName)

        expect(sendMailSpy).toHaveBeenCalledWith(expect.objectContaining({ id: member.id }))
      })

      test('notify members with family membership but also are billingMember', async () => {
        const { processor, sendMailSpy } = setup()

        const familyMember = await generateMemberWithEmail({
          membershipEndDate: addDays(fromDate, 27)
        })
        const billingMember = await generateMemberWithEmail({
          membershipEndDate: addDays(fromDate, 27)
        })
        await billingMember.setFamilyMembers([familyMember])

        await ah.api.models.payment.create(generatePayment({
          billingMemberId: billingMember.id,
          members: [billingMember.id, familyMember.id],
          membershipType: 'family'
        }))

        await processor.processMemberships(fromDate, addDays(fromDate, 30), memberCheckFlagFieldName)

        expect(sendMailSpy).toHaveBeenCalledWith(expect.objectContaining({ id: billingMember.id }))
      })

      test('skip members with expired membership', async () => {
        const { processor, sendMailSpy } = setup()

        await generateMemberAndPayment({
          memberOpts: {
            membershipEndDate: subDays(fromDate, 1)
          }
        })

        await processor.processMemberships(fromDate, addDays(fromDate, 30), memberCheckFlagFieldName)

        expect(sendMailSpy).not.toHaveBeenCalled()
      })

      test('do not try notify expiring member without member.email', async () => {
        const { processor, sendMailSpy } = setup()

        const { member } = await generateMemberAndPayment({
          memberOpts: { membershipEndDate: addDays(fromDate, 27) }
        })

        await member.update({ email: null })

        await processor.processMemberships(fromDate, addDays(fromDate, 30), memberCheckFlagFieldName)

        expect(sendMailSpy).not.toBeCalled()
      })

      test('throw error when param fromDate is missing', async () => {
        const { processor } = setup()

        await expect(processor.processMemberships(null, new Date())).rejects.toMatchSnapshot()
      })

      test('throw error when param toDate is missing', async () => {
        const { processor } = setup()

        await expect(processor.processMemberships(new Date(), null)).rejects.toMatchSnapshot()
      })
    })
  }
  testProcessMemberships('notifiedForExpiringDate')
  testProcessMemberships('notifiedForExpiredDate')

  const testTasksMethods = (methodName, validateDates) => {
    describe(`#${methodName}`, () => {
      const setup = (configOverride) => {
        const processor = new MembershipExpirationProcessor({
          api: ah.api,
          config: {
            days: 30,
            minDays: 7,
            ...configOverride
          }
        })
        const mockProcess = processor.processMemberships = jest.fn()
        return { processor, mockProcess }
      }

      test('should pass correct from and to dates', async () => {
        const { processor, mockProcess } = await setup({
          minDays: 10,
          days: 20
        })

        await validateDates(processor, mockProcess)
      })

      test('should validate minDaysBeforeExpiration for string values', async () => {
        const { processor } = await setup({
          minDays: 'some string'
        })

        await expect(processor[methodName]()).rejects.toMatchSnapshot()
      })

      test('should validate minDaysBeforeExpiration for negative values', async () => {
        const { processor } = await setup({
          minDays: -2
        })

        await expect(processor[methodName]()).rejects.toMatchSnapshot()
      })

      test('should validate daysBeforeExpiration for string values', async () => {
        const { processor } = await setup({
          days: 'some string'
        })

        await expect(processor[methodName]()).rejects.toMatchSnapshot()
      })

      test('should validate daysBeforeExpiration for negative values', async () => {
        const { processor } = await setup({
          days: -1
        })

        await expect(processor[methodName]()).rejects.toMatchSnapshot()
      })
    })
  }
  testTasksMethods('remindExpiring', async (processor, mockProcess) => {
    const fromDate = addDays(new Date(), 10)
    const toDate = addDays(new Date(), 20)

    await processor.remindExpiring()

    expect(mockProcess).toHaveBeenCalled()
    expect(mockProcess.mock.calls[0][0]).toBeSameDay(fromDate)
    expect(mockProcess.mock.calls[0][1]).toBeSameDay(toDate)
  })
  testTasksMethods('remindExpired', async (processor, mockProcess) => {
    const toDate = subDays(new Date(), 10)
    const fromDate = subDays(new Date(), 20)

    await processor.remindExpired()

    expect(mockProcess).toHaveBeenCalled()
    expect(mockProcess.mock.calls[0][0]).toBeSameDay(fromDate)
    expect(mockProcess.mock.calls[0][1]).toBeSameDay(toDate)
  })
})
