// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const path = require('path')
const { generateMember } = require('../../test/generators')

describe('action import', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  beforeEach(async () => {
    await ah.api.models.payment.destroy({ where: {}, force: true })
    await ah.api.models.member.destroy({ where: {}, force: true })
  })

  describe('#members', () => {
    const action = 'import:member'
    test('should import members', async () => {
      const params = {
        create: true,
        update: false,
        failOnError: false,
        dryRun: false,
        defaults: JSON.stringify({
          category: 'regular'
        }),
        file: { path: path.join('test/files', 'import_members.csv') }
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

    const prepareData = async () => {
      const member1 = await ah.api.models.member.create(generateMember({ accessId: 100 }))
      const member2 = await ah.api.models.member.create(generateMember({ accessId: 101 }))
      const member3 = await ah.api.models.member.create(generateMember({ accessId: 102 }))
      const family1 = await ah.api.models.member.create(generateMember())
      const family2 = await ah.api.models.member.create(generateMember())
      await member2.setFamilyMembers([family1, family2])
      return { member1, member2, member3, family1, family2 }
    }

    const executeImport = async () => {
      const params = {
        create: true,
        update: false,
        failOnError: false,
        dryRun: false,
        defaults: JSON.stringify({
          paymentType: 'cash',
          membershipType: 'single'
        }),
        file: { path: path.join('test/files', 'import_payments.csv') }
      }
      return ah.runAdminAction(action, params)
    }

    test('should import payments', async () => {
      const { member2, family1, family2 } = await prepareData()
      const res = await executeImport()

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
      const familyPayment = await ah.api.models.payment.findOne({ where: { info: '30 EUR' } })
      expect(await familyPayment.getMembers()).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: member2.id }),
        expect.objectContaining({ id: family1.id }),
        expect.objectContaining({ id: family2.id })
      ]))
    })

    describe('membership recalculation', () => {
      test('should enqueue billing member for single payment', async () => {
        const enqueueSpy = jest.spyOn(ah.api.membership, 'enqueueRecompute')
        const { member1 } = await prepareData()
        await executeImport()
        expect(enqueueSpy).toHaveBeenCalledWith(expect.arrayContaining([member1.id]))
      })

      test('should enqueue family member for family payment', async () => {
        const enqueueSpy = jest.spyOn(ah.api.membership, 'enqueueRecompute')
        const { family1, family2 } = await prepareData()
        await executeImport()
        expect(enqueueSpy).toHaveBeenCalledWith(expect.arrayContaining([family1.id, family2.id]))
      })

      test('should enqueue billing member for generic payment', async () => {
        const enqueueSpy = jest.spyOn(ah.api.membership, 'enqueueRecompute')
        const { member3 } = await prepareData()
        await executeImport()
        expect(enqueueSpy).toHaveBeenCalledWith(expect.arrayContaining([member3.id]))
      })
    })
  })

  describe('#familyMembers', async () => {
    const action = 'import:family'
    test('should import family members', async () => {
      const master1 = await ah.api.models.member.create(generateMember({ cardId: 100 }))
      const family1 = await ah.api.models.member.create(generateMember({ cardId: 101 }))
      const family2 = await ah.api.models.member.create(generateMember({ cardId: 102 }))
      const master2 = await ah.api.models.member.create(generateMember({ cardId: 103 }))
      const family3 = await ah.api.models.member.create(generateMember({ cardId: 104 }))
      const family4 = await ah.api.models.member.create(generateMember({ cardId: 105 }))

      await master2.setFamilyMembers([family4])

      const params = {
        create: true,
        update: false,
        failOnError: false,
        dryRun: false,
        file: { path: path.join('test/files', 'import_family.csv') }
      }
      const res = await ah.runAdminAction(action, params)

      expect(res.data).toEqual(expect.objectContaining({
        totalRows: 4,
        inserts: 3,
        updates: 0,
        errors: 0,
        ignored: 1,
        dryRun: false,
        success: true
      }))

      await master1.reload()
      await master2.reload()

      expect(await master1.hasFamilyMembers([family1, family2])).toBeTruthy()
      expect((await master1.getFamilyMembers()).length).toBe(2)

      expect(await master2.hasFamilyMembers([family3, family4])).toBeTruthy()
      expect((await master2.getFamilyMembers()).length).toBe(2)
    })
  })
})
