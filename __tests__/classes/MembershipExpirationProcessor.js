// eslint-disable-next-line no-unused-vars
/* global jest, describe, test, expect, jest, beforeEach, afterEach */

const ah = require('../../test/ah-setup')
const MembershipExpirationProcessor = require('../../classes/MembershipExpirationProcessor')
const addDays = require('date-fns/add_days')
const subDays = require('date-fns/sub_days')

const expectedError = new Error('Provide time period!')

describe('MembershipExpiration', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  describe('processing memberships for expiration', () => {
    test('notify exipiring members with email task', async () => {
      const expirationProcessor = new MembershipExpirationProcessor({
        api: ah.api,
        config: {
          daysBeforeExpiration: 30,
          emailTemplateName: ''
        }
      })
      const sendMailSpy = jest.spyOn(expirationProcessor, 'enqueueSendMail')

      var fromDate = new Date()
      var toDate = addDays(fromDate, 30)
      await expirationProcessor.processMemberships(fromDate, toDate)

      expect(sendMailSpy).toHaveBeenCalledTimes(1)
    })

    test('notify expired member with email ', async () => {
      const expirationProcessor = new MembershipExpirationProcessor({
        api: ah.api,
        config: {
          daysBeforeExpiration: 30,
          emailTemplateName: ''
        }
      })
      const sendMailSpy = jest.spyOn(expirationProcessor, 'enqueueSendMail')

      var fromDate = new Date()
      var toDate = subDays(fromDate, 30)
      await expirationProcessor.processMemberships(toDate, fromDate)

      expect(sendMailSpy).toHaveBeenCalledTimes(1)
    })

    test('throw error when from date is not provided ', async () => {
      const expirationProcessor = new MembershipExpirationProcessor({
        api: ah.api,
        config: {
          daysBeforeExpiration: 30,
          emailTemplateName: ''
        }
      })
      expect(await expirationProcessor.processMemberships(null, new Date())).toEqual(expectedError)
    })

    test('throw error when from date is not provided ', async () => {
      const expirationProcessor = new MembershipExpirationProcessor({
        api: ah.api,
        config: {
          daysBeforeExpiration: 30,
          emailTemplateName: ''
        }
      })
      expect(await expirationProcessor.processMemberships(new Date(), null)).toEqual(expectedError)
    })
  })
})
