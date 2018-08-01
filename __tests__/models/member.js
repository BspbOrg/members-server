// eslint-disable-next-line no-unused-vars
/* globals describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const {generateMember} = require('../../test/generators')
const {testRequiredFields} = require('../../test/helpers')
const dateFormat = require('date-fns/format')

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

    describe('validation', async () => {
      beforeEach(async () => {
        await ah.api.models.payment.destroy({where: {}, force: true})
        await ah.api.models.member.destroy({where: {}, force: true})
      })

      test('should not allow duplicate access ids', async () => {
        await expect(ah.api.models.member.create(generateMember({accessId: '111'}))).resolves.toBeDefined()
        await expect(ah.api.models.member.create(generateMember({accessId: '111'}))).rejects.toThrowErrorMatchingSnapshot()
      })

      test('should not allow duplicate card ids', async () => {
        await expect(ah.api.models.member.create(generateMember({cardId: '111'}))).resolves.toBeDefined()
        await expect(ah.api.models.member.create(generateMember({cardId: '111'}))).rejects.toThrowErrorMatchingSnapshot()
      })

      test('should not allow duplicate username', async () => {
        await expect(ah.api.models.member.create(generateMember({username: 'user'}))).resolves.toBeDefined()
        await expect(ah.api.models.member.create(generateMember({username: 'user'}))).rejects.toThrowErrorMatchingSnapshot()
      })

      test('should allow date object for membershipStartDate', async () => {
        const date = new Date()
        member = await ah.api.models.member.create(generateMember({membershipStartDate: date}))
        expect(member.membershipStartDate).toBe(dateFormat(date, 'YYYY-MM-DD'))
      })

      test('should allow string with proper format for membershipStartDate', async () => {
        const date = '2017-05-20'
        member = await ah.api.models.member.create(generateMember({membershipStartDate: date}))
        expect(dateFormat(member.membershipStartDate, 'YYYY-MM-DD')).toBe(date)
      })

      test('should not allow string with wrong format for membershipStartDate', async () => {
        const date = '20/05/2017'
        await expect(ah.api.models.member.create(generateMember({membershipStartDate: date}))).rejects.toThrowErrorMatchingSnapshot()
      })

      test('should fail on invalid age category', async () => {
        await expect(ah.api.models.member.create(generateMember({category: 'unsupported category'}))).rejects.toThrowErrorMatchingSnapshot()
      })

      describe('email field', async () => {
        const validEmails = [
          'customer/department=shipping@example.com',
          '$A12345@example.com',
          '!def!xyz%abc@example.com',
          '_somename@example.com',
          'user+mailbox@example.com',
          'test_test@gmail.com'
        ]

        validEmails.forEach(email => {
          test(`should allow following email: ${email}`, async () => {
            await expect(ah.api.models.member.create(generateMember({email: email}))).resolves.toBeDefined()
          })
        })

        const invalidEmails = [
          'Abc\\@def@example.com', // actually valid but still not supported by email-validator
          'Fred\\ Bloggs@example.com', // actually valid but still not supported by email-validator
          'Joe.\\\\Blow@example.com', // actually valid but still not supported by email-validator
          'user@[192.168.0.1]', // actually valid but still not supported by email-validator
          'joe@[::1]', // actually valid but still not supported by email-validator
          'joe@[2001:db8::ff00:42:8329]', // actually valid but still not supported by email-validator
          '"Abc@def"@example.com', // actually valid but still not supported by email-validator
          '"Fred Bloggs"@example.com', // actually valid but still not supported by email-validator
          'adsd.443',
          'test@test',
          'test@test@test.test'
        ]

        invalidEmails.forEach(email => {
          test(`should not allow following email: ${email}`, async () => {
            await expect(ah.api.models.member.create(generateMember({email: email}))).rejects.toThrowErrorMatchingSnapshot()
          })
        })
      })
    })

    describe('format phone number', async () => {
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
        },
        {
          given: '+359^896^111^222',
          expected: '+359896111222',
          success: true
        },
        {
          given: '+359+896+111+222',
          expected: '+359896111222',
          success: true
        }
      ]

      phoneNumberScenarios.filter(scenario => scenario.success).forEach((scenario) => {
        test(`should format phone number ${scenario.given}`, async () => {
          const createdMember = await ah.api.models.member.create(generateMember({phone: scenario.given}))
          expect(createdMember.phone).toBe(scenario.expected)
        })
      })

      phoneNumberScenarios.filter(scenario => !scenario.success).forEach((scenario) => {
        test(`should fail on phone number ${scenario.given}`, async () => {
          expect(ah.api.models.member.create(generateMember({phone: scenario.given}))).rejects.toThrowErrorMatchingSnapshot()
        })
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
