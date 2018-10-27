// eslint-disable-next-line no-unused-vars
/* global jest, describe, test, expect, jest, beforeEach, afterEach, beforeAll, afterAll */

const ah = require('../../test/ah-setup')
const Membership = require('../../classes/Membership')
const { generateMember, generatePayment } = require('../../test/generators')
const addDays = require('date-fns/add_days')
const subDays = require('date-fns/sub_days')

const date = new Date()

const generateMemberWithEmail = async (member) => {
  return ah.api.models.member.create(generateMember({
    email: `member.${generateMember.index}@bspb.org`,
    ...member
  }))
}

const generateMemberAndPayment = async ({ member: memberOpts, payment: paymentOpts }) => {
  const member = await generateMemberWithEmail(memberOpts)
  const payment = await ah.api.models.payment.create(generatePayment({
    billingMemberId: member.id,
    members: [member.id],
    ...paymentOpts
  }))
  return { member, payment }
}

const setup = ({ expiringReminder, expiredNotice, ...config } = {}) => {
  const processor = new Membership({
    api: ah.api,
    config: {
      expiringReminder: {
        frequency: 0,
        maxDays: 30,
        minDays: 5,
        templateName: 'expiringReminder',
        emailSubject: 'Membership expiration reminder',
        ...expiringReminder
      },
      expiredNotice: {
        frequency: 0,
        maxDays: 90,
        minDays: 0,
        templateName: 'expiredNotification',
        emailSubject: 'Membership expired notification',
        ...expiredNotice
      },
      ...config
    }
  })
  const sendMailSpy = jest.spyOn(processor, 'enqueueEmail')
  const findSpy = jest.spyOn(processor, 'findExpiringPayingMembers')
  return { processor, sendMailSpy, findSpy }
}

describe('Membership integration', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  const testFindExpiringPayingMembers = (memberCheckFlagFieldName) => {
    describe(`processing memberships for ${memberCheckFlagFieldName}`, () => {
      const process = async (
        {
          config,
          fromDate = addDays(new Date(), 0),
          toDate = addDays(new Date(), 30)
        } = {}
      ) => {
        const { processor } = setup(config)
        const members = await processor.findExpiringPayingMembers(fromDate, toDate, memberCheckFlagFieldName)
        return { processor, members }
      }

      beforeEach(async () => {
        await ah.api.models.payment.destroy({ where: {}, force: true })
        await ah.api.models.member.destroy({ where: {}, force: true })
      })

      test('notify expiring member with email', async () => {
        const { member } = await generateMemberAndPayment({
          member: { membershipEndDate: addDays(date, 27) }
        })

        const { members } = await process()

        expect(members).toEqual(expect.arrayContaining([expect.objectContaining({ id: member.id })]))
      })

      test('do not notify members outside interval', async () => {
        const { member } = await generateMemberAndPayment({
          member: { membershipEndDate: addDays(date, 100) }
        })

        const { members } = await process()

        expect(members).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: member.id })]))
      })

      test('skip already notified', async () => {
        const membershipEndDate = addDays(date, 27)

        const { member } = await generateMemberAndPayment({
          member: {
            membershipEndDate,
            [memberCheckFlagFieldName]: membershipEndDate
          }
        })

        const { members } = await process()

        expect(members).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: member.id })]))
      })

      test('skip members with group membership', async () => {
        const { member } = await generateMemberAndPayment({
          member: { membershipEndDate: addDays(date, 27) },
          payment: { membershipType: 'group' }
        })

        const { members } = await process()

        expect(members).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: member.id })]))
      })

      test('skip members who are not billing member', async () => {
        const member = await generateMemberWithEmail({
          membershipEndDate: addDays(date, 27)
        })
        const billingMember = await generateMemberWithEmail({
          membershipEndDate: addDays(date, 27)
        })
        await ah.api.models.payment.create(generatePayment({
          billingMemberId: billingMember.id,
          members: [billingMember.id, member.id]
        }))

        const { members } = await process()

        expect(members).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: member.id })]))
      })

      test('skip members who have no payments', async () => {
        const member = await generateMemberWithEmail({
          membershipEndDate: addDays(date, 27)
        })

        const { members } = await process()

        expect(members).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: member.id })]))
      })

      test('skip members with older regular membership and newer group membership', async () => {
        const member = await generateMemberWithEmail({
          membershipEndDate: addDays(date, 27)
        })

        // older payment
        await ah.api.models.payment.create(generatePayment({
          billingMemberId: member.id,
          members: [member.id],
          paymentDate: subDays(date, 20),
          membershipType: 'regular'
        }))

        // newer payment
        await ah.api.models.payment.create(generatePayment({
          billingMemberId: member.id,
          members: [member.id],
          paymentDate: subDays(date, 10),
          membershipType: 'group'
        }))

        const { members } = await process()

        expect(members).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: member.id })]))
      })

      test('notify members with newer regular membership and older group membership', async () => {
        const member = await generateMemberWithEmail({
          membershipEndDate: addDays(date, 27)
        })

        // older payment
        await ah.api.models.payment.create(generatePayment({
          billingMemberId: member.id,
          members: [member.id],
          paymentDate: subDays(date, 20),
          membershipType: 'group'
        }))

        // newer payment
        await ah.api.models.payment.create(generatePayment({
          billingMemberId: member.id,
          members: [member.id],
          paymentDate: subDays(date, 10),
          membershipType: 'regular'
        }))

        const { members } = await process()

        expect(members).toEqual(expect.arrayContaining([expect.objectContaining({ id: member.id })]))
      })

      test('notify members with family membership but also billingMember', async () => {
        const familyMember = await generateMemberWithEmail({
          membershipEndDate: addDays(date, 27)
        })
        const billingMember = await generateMemberWithEmail({
          membershipEndDate: addDays(date, 27)
        })
        await billingMember.setFamilyMembers([familyMember])

        await ah.api.models.payment.create(generatePayment({
          billingMemberId: billingMember.id,
          members: [billingMember.id, familyMember.id],
          membershipType: 'family'
        }))

        const { members } = await process()

        expect(members).toEqual(expect.arrayContaining([expect.objectContaining({ id: billingMember.id })]))
      })

      test('skip members with expired membership', async () => {
        const { member } = await generateMemberAndPayment({
          member: {
            membershipEndDate: subDays(date, 1)
          }
        })

        const { members } = await process()

        expect(members).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: member.id })]))
      })

      test('do not try notify expiring member without member.email', async () => {
        const { member } = await generateMemberAndPayment({
          member: { membershipEndDate: addDays(date, 27) }
        })

        await member.update({ email: null })

        const { members } = await process()

        expect(members).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: member.id })]))
      })

      test('throw error when param fromDate is missing', async () => {
        const { processor } = setup()

        await expect(processor.findExpiringPayingMembers(null, date)).rejects.toMatchSnapshot()
      })

      test('throw error when param toDate is missing', async () => {
        const { processor } = setup()

        await expect(processor.findExpiringPayingMembers(date)).rejects.toMatchSnapshot()
      })

      test('throw error when param memberCheckFlagFieldName is missing', async () => {
        const { processor } = setup()

        await expect(processor.findExpiringPayingMembers(date, date)).rejects.toMatchSnapshot()
      })
    })
  }
  testFindExpiringPayingMembers('notifiedForExpiringDate')
  testFindExpiringPayingMembers('notifiedForExpiredDate')

  const testTasksMethods = (methodName, configName, generateDates, notifiedField) => {
    describe(`#${methodName}`, () => {
      test('should pass correct from and to dates', async () => {
        const { processor, findSpy } = await setup({
          [configName]: {
            minDays: 10,
            maxDays: 20
          }
        })

        const { fromDate, toDate } = generateDates()

        await processor[methodName]()

        expect(findSpy).toHaveBeenCalled()
        expect(findSpy.mock.calls[0][0]).toBeSameDay(fromDate)
        expect(findSpy.mock.calls[0][1]).toBeSameDay(toDate)
      })

      test('should validate minDays for string values', async () => {
        const { processor } = await setup({
          [configName]: {
            minDays: 'some string'
          }
        })

        await expect(processor[methodName]()).rejects.toMatchSnapshot()
      })

      test('should validate minDays for negative values', async () => {
        const { processor } = await setup({
          [configName]: {
            minDays: -2
          }
        })

        await expect(processor[methodName]()).rejects.toMatchSnapshot()
      })

      test('should validate maxDays for string values', async () => {
        const { processor } = await setup({
          [configName]: {
            maxDays: 'some string'
          }
        })

        await expect(processor[methodName]()).rejects.toMatchSnapshot()
      })

      test('should validate maxDays for negative values', async () => {
        const { processor } = await setup({
          [configName]: {
            maxDays: -1
          }
        })

        await expect(processor[methodName]()).rejects.toMatchSnapshot()
      })

      test('send email to matching members', async () => {
        const { processor, sendMailSpy, findSpy } = await setup()

        const member = await generateMemberWithEmail()

        findSpy.mockReturnValue([member])
        sendMailSpy.mockReturnValue(true)

        await processor[methodName]()

        expect(sendMailSpy).toHaveBeenCalled()
        expect(sendMailSpy.mock.calls[0][0]).toEqual([member])
      })

      test('save notified date', async () => {
        const { processor, findSpy } = setup()

        const { member } = await generateMemberAndPayment({
          member: {
            membershipEndDate: addDays(date, 27),
            [notifiedField]: null
          }
        })
        findSpy.mockReturnValue([member])

        const { membershipEndDate } = member
        await processor[methodName]()
        await member.reload()

        expect(member[notifiedField]).toEqual(membershipEndDate)
      })
    })
  }

  testTasksMethods('sendReminderToExpiring', 'expiringReminder', () => ({
    fromDate: addDays(date, 10),
    toDate: addDays(date, 20)
  }), 'notifiedForExpiringDate')

  testTasksMethods('sendNoticeToExpired', 'expiredNotice', () => ({
    toDate: subDays(date, 10),
    fromDate: subDays(date, 20)
  }), 'notifiedForExpiredDate')
})
