// eslint-disable-next-line no-unused-vars
/* globals describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const { generateMember } = require('../../test/generators')
const { testRequiredFields } = require('../../test/helpers')

describe('model member', () => {
  beforeAll(async () => {
    await ah.start()
    // await ah.api.sequelize.sequelize.sync({logging: ah.api.log})
    await ah.api.models.payment.destroy({ where: {}, force: true })
    await ah.api.models.member.destroy({ where: {}, force: true })
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

    testRequiredFields('member', () => member, [ 'firstName', 'lastName' ])
  })

  describe('with some members', () => {
    let member1
    let member2
    let member3

    beforeAll(async () => {
      member1 = await ah.api.models.member.create(generateMember())
      member2 = await ah.api.models.member.create(generateMember())
      member3 = await ah.api.models.member.create(generateMember())
      await member1.setFamilyMembers([ member2.id, member3.id ])
    })
    afterAll(async () => {
      member1.destroy({ force: true })
      member2.destroy({ force: true })
      member3.destroy({ force: true })
    })

    test('should have family association', async () => {
      const family = await member1.getFamilyMembers()
      expect(family).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: member2.id }),
        expect.objectContaining({ id: member3.id })
      ]))
    })

    describe('family scope', () => {
      describe('for family master', () => {
        test('should exclude family master member', async () => {
          const members = await ah.api.models.member.scopeFamily(member1.id).findAll({})
          expect(members).not.toEqual(expect.arrayContaining([ expect.objectContaining({ id: member1.id }) ]))
        })

        test('should include members', async () => {
          const members = await ah.api.models.member.scopeFamily(member1.id).findAll({})
          expect(members).toEqual(expect.arrayContaining([ expect.objectContaining({ id: member2.id }) ]))
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
