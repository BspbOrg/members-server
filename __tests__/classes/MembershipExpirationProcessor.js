// eslint-disable-next-line no-unused-vars
/* global jest, describe, test, expect, jest, beforeEach, afterEach */

const ah = require('../../test/ah-setup')
const MembershipExpirationProcessor = require('../../classes/MembershipExpirationProcessor')
const { generateMember, generatePayment } = require('../../test/generators')
const addDays = require('date-fns/add_days')

const expectedError = new Error('Provide time period!')
const fromDate = new Date()

describe('MembershipExpiration', () => {
  const setup = () => {
    return new MembershipExpirationProcessor({
      api: ah.api,
      config: {
        daysBeforeExpiration: 30,
        emailTemplateName: ''
      }
    })
  }
  const generateMemberAndPayment = async ({ memberOpts = { }, paymentOps = { } }) => {
    const member = await ah.api.models.member.create(generateMember({
      ...memberOpts
    }))
    await ah.api.models.payment.create(generatePayment({
      paymentDate: new Date(),
      paymentType: `cash`,
      billingMemberId: member.id,
      members: [member.id],
      ...paymentOps
    }))
  }
  beforeAll(async () => {
    await ah.start()
  })
  afterAll(ah.stop)
  beforeEach(async () => {
    await ah.api.models.payment.destroy({ where: {}, force: true })
    await ah.api.models.member.destroy({ where: {}, force: true })
  })

  describe('processing memberships for expiration', () => {
    test('notify exipiring members with membershipEndDate in def interval', async () => {
      const expirationProcessor = setup()
      const sendMailSpy = jest.spyOn(expirationProcessor, 'enqueueSendMail')

      await generateMemberAndPayment({ memberOpts: { membershipEndDate: addDays(fromDate, 27) } })
      await generateMemberAndPayment({ memberOpts: { membershipEndDate: addDays(fromDate, 31) } })

      await expirationProcessor.processMemberships(fromDate, addDays(fromDate, 30))

      expect(sendMailSpy).toHaveBeenCalledTimes(1)
    })

    test('notify expiring member with email', async () => {
      const expirationProcessor = setup()
      const sendMailSpy = jest.spyOn(expirationProcessor, 'enqueueSendMail')

      await generateMemberAndPayment({
        memberOpts: {
          membershipEndDate: addDays(fromDate, 27)
        }
      })

      await expirationProcessor.processMemberships(fromDate, addDays(fromDate, 30))

      expect(sendMailSpy).toHaveBeenCalledTimes(1)
    })

    test('notify expiring member with email and save date of sending mail ', async () => {
      const expirationProcessor = setup()

      await generateMemberAndPayment({
        memberOpts: {
          id: 11,
          membershipEndDate: addDays(fromDate, 27)
        }
      })

      await expirationProcessor.processMemberships(fromDate, addDays(fromDate, 30))
      const updatedMember = ah.api.models.member.findOne({ where: { id: 11 } })

      expect(updatedMember.notifiedForExpiringDate).toEqual(updatedMember.membershipEndDate)
    })

    test('do not notify expiring member with email when already notified ', async () => {
      const expirationProcessor = setup()
      const sendMailSpy = jest.spyOn(expirationProcessor, 'enqueueSendMail')

      await generateMemberAndPayment({
        memberOpts: {
          id: 11,
          membershipEndDate: addDays(fromDate, 27),
          notifiedForExpiringDate: addDays(fromDate, 27)
        }
      })

      await expirationProcessor.processMemberships(fromDate, addDays(fromDate, 30))

      expect(sendMailSpy).toHaveBeenCalledTimes(0)
    })

    test('do not notify expiring member with payment.paymentType == "group" ', async () => {
      const expirationProcessor = setup()
      const sendMailSpy = jest.spyOn(expirationProcessor, 'enqueueSendMail')

      await generateMemberAndPayment({
        memberOpts: {
          id: 11,
          membershipEndDate: addDays(fromDate, 27)
        },
        paymentOps: {
          paymentType: 'group'
        }
      })

      await expirationProcessor.processMemberships(fromDate, addDays(fromDate, 30))

      expect(sendMailSpy).toHaveBeenCalledTimes(0)
    })

    test('do not notify expiring members who are not billing member', async () => {
      const expirationProcessor = setup()
      const sendMailSpy = jest.spyOn(expirationProcessor, 'enqueueSendMail')
      await ah.api.models.member.create(await generateMember({ id: 111, membershipEndDate: addDays(fromDate, 27) }))
      await generateMemberAndPayment({
        memberOpts: {
          id: 11,
          membershipEndDate: addDays(fromDate, 27)
        },
        paymentOps: {
          members: [11, 111],
          billingMemberId: 111
        }
      })

      await expirationProcessor.processMemberships(fromDate, addDays(fromDate, 30))

      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 111 }))
    })

    test('throw error when from date is not provided ', async () => {
      const expirationProcessor = setup()
      expect(await expirationProcessor.processMemberships(null, new Date())).toEqual(expectedError)
    })

    test('throw error when from date is not provided ', async () => {
      const expirationProcessor = setup()
      expect(await expirationProcessor.processMemberships(new Date(), null)).toEqual(expectedError)
    })
  })
})
