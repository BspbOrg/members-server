// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const path = require('path')
const {generateMember} = require('../../test/generators')

describe('action import', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  beforeEach(async () => {
    await ah.api.models.payment.destroy({where: {}, force: true})
    await ah.api.models.member.destroy({where: {}, force: true})
  })

  describe('#members', () => {
    const action = 'import:member'
    test('should import members', async () => {
      const params = {
        create: true,
        update: false,
        failOnError: false,
        dryRun: false,
        defaults: {
          category: 'regular'
        },
        file: {path: path.join('test/files', 'import_members.csv')}
      }
      const res = await ah.runAdminAction(action, params)

      expect(res.data).toEqual(expect.objectContaining({
        totalRows: 3,
        inserts: 3,
        updates: 0,
        errors: 0,
        ignored: 0,
        dryRun: false,
        success: true
      }))

      expect(await ah.api.models.member.count()).toBe(3)
    })
  })

  describe('#payments', async () => {
    const action = 'import:payment'
    test('should import payments', async () => {
      await ah.api.models.member.create(generateMember({accessId: 100}))
      const member2 = await ah.api.models.member.create(generateMember({accessId: 101}))
      await ah.api.models.member.create(generateMember({accessId: 102}))
      const family1 = await ah.api.models.member.create(generateMember())
      const family2 = await ah.api.models.member.create(generateMember())
      await member2.setFamilyMembers([family1, family2])

      const params = {
        create: true,
        update: false,
        failOnError: false,
        dryRun: false,
        defaults: {
          paymentType: 'cash',
          membershipType: 'single'
        },
        file: {path: path.join('test/files', 'import_payments.csv')}
      }
      const res = await ah.runAdminAction(action, params)

      expect(res.data).toEqual(expect.objectContaining({
        totalRows: 3,
        inserts: 3,
        updates: 0,
        errors: 0,
        ignored: 0,
        dryRun: false,
        success: true
      }))

      expect((await ah.api.models.payment.findAll()).length).toBe(3)
      const familyPayment = await ah.api.models.payment.findOne({where: {info: '30 EUR'}})
      expect(await familyPayment.hasMembers([member2, family1, family2])).toBeTruthy()
    })
  })
})
