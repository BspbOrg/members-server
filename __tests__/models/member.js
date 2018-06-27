// eslint-disable-next-line no-unused-vars
/* globals describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const {generateMember} = require('../../test/generators')
const {testRequiredFields} = require('../../test/helpers')

describe('model member', () => {
  beforeAll(async () => {
    await ah.start()
    // await ah.api.sequelize.sequelize.sync({logging: ah.api.log})
    await ah.api.models.payment.destroy({where: {}, force: true})
    await ah.api.models.member.destroy({where: {}, force: true})
  })
  afterAll(ah.stop)

  test('should begin with no members', async () => {
    expect.assertions(1)
    await expect(ah.api.models.member.findAll()).resolves.toHaveLength(0)
  })

  describe('creating', () => {
    let member
    beforeEach(() => {
      member = generateMember()
    })

    testRequiredFields('member', () => member, ['firstName', 'lastName'])

    describe('should validate fields', async () => {
      beforeEach(async () => {
        await ah.api.models.payment.destroy({where: {}, force: true})
        await ah.api.models.member.destroy({where: {}, force: true})
      })

      test('not allow duplicate access ids', async () => {
        await expect(ah.api.models.member.create(generateMember({accessId: '111'}))).resolves.toBeDefined()
        await expect(ah.api.models.member.create(generateMember({accessId: '111'}))).rejects.toThrowErrorMatchingSnapshot()
      })

      test('not allow duplicate card ids', async () => {
        await expect(ah.api.models.member.create(generateMember({cardId: '111'}))).resolves.toBeDefined()
        await expect(ah.api.models.member.create(generateMember({cardId: '111'}))).rejects.toThrowErrorMatchingSnapshot()
      })

      test('not allow duplicate username', async () => {
        await expect(ah.api.models.member.create(generateMember({username: 'user'}))).resolves.toBeDefined()
        await expect(ah.api.models.member.create(generateMember({username: 'user'}))).rejects.toThrowErrorMatchingSnapshot()
      })

      test('not allow invalid email', async () => {
        await expect(ah.api.models.member.create(generateMember({email: 'adsd.443'}))).rejects.toThrowErrorMatchingSnapshot()
        await expect(ah.api.models.member.create(generateMember({email: 'test@test'}))).rejects.toThrowErrorMatchingSnapshot()
        await expect(ah.api.models.member.create(generateMember({email: 'test@test@test.test'}))).rejects.toThrowErrorMatchingSnapshot()
      })
    })

    describe('should transform phone number', async () => {
      beforeEach(async () => {
        await ah.api.models.payment.destroy({where: {}, force: true})
        await ah.api.models.member.destroy({where: {}, force: true})
      })

      const phoneNumberScenarios = [
        {
          given: '+359dg 89gd6 r111-=f222',
          expected: '+359896111222',
          success: true
        },
        {
          given: '+359 896 111 222',
          expected: '+359896111222',
          success: true
        },
        {
          given: '0896/111 222',
          expected: '+359896111222',
          success: true
        },
        {
          given: '00359 896 111 222',
          expected: '+359896111222',
          success: true
        },
        {
          given: '00359896111222',
          expected: '+359896111222',
          success: true
        },
        {
          given: '896111222',
          expected: null,
          success: false
        },
        {
          given: '044 772 0883 757', // GB
          expected: null,
          success: false
        },
        {
          given: '+44 772 0883 757', // GB
          expected: '+447720883757',
          success: true
        },
        {
          given: '+905322472296', // TR
          expected: '+905322472296',
          success: true
        },
        {
          given: '015206 276967', // DE
          expected: null,
          success: false
        },
        {
          given: '+4915206276967', // DE
          expected: '+4915206276967',
          success: true
        },
        {
          given: '01322 342988', // GB
          expected: '+359896111222',
          success: false
        },
        {
          given: '+44 1322 342988', // GB
          expected: '+441322342988',
          success: true
        }
      ]

      phoneNumberScenarios.forEach((scenario, index) => {
        if (scenario.success) {
          test(`should format phone number ${scenario.given}`, async () => {
            const createdMember = await ah.api.models.member.create(generateMember({phone: scenario.given}))
            expect(createdMember.phone).toBe(scenario.expected)
          })
        } else {
          test(`should fail on phone number ${scenario.given}`, async () => {
            expect(ah.api.models.member.create(generateMember({phone: scenario.given}))).rejects.toThrowErrorMatchingSnapshot()
          })
        }
      })
    })
  })

  describe('with some members', () => {
    let member1
    let member2
    let member3

    beforeAll(async () => {
      member1 = await ah.api.models.member.create(generateMember())
      member2 = await ah.api.models.member.create(generateMember())
      member3 = await ah.api.models.member.create(generateMember())
      await member1.setFamilyMembers([member2.id, member3.id])
    })
    afterAll(async () => {
      member1.destroy({force: true})
      member2.destroy({force: true})
      member3.destroy({force: true})
    })

    test('should have family association', async () => {
      const family = await member1.getFamilyMembers()
      expect(family).toEqual(expect.arrayContaining([
        expect.objectContaining({id: member2.id}),
        expect.objectContaining({id: member3.id})
      ]))
    })

    describe('family scope', () => {
      describe('for family master', () => {
        test('should exclude family master member', async () => {
          const members = await ah.api.models.member.scopeFamily(member1.id).findAll({})
          expect(members).not.toEqual(expect.arrayContaining([expect.objectContaining({id: member1.id})]))
        })

        test('should include members', async () => {
          const members = await ah.api.models.member.scopeFamily(member1.id).findAll({})
          expect(members).toEqual(expect.arrayContaining([expect.objectContaining({id: member2.id})]))
        })
      })

      describe('for family member', () => {
        test('should include none', async () => {
          const members = await ah.api.models.member.scopeFamily(member2.id).findAll({})
          expect(members).toHaveLength(0)
        })
      })
    })
  })
})
