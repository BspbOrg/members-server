// eslint-disable-next-line no-unused-vars
/* globals describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const processFamily = require('../../classes/FamilyMembersPreprocessor')
const {generateMember} = require('../../test/generators')

describe('family members preprocessor', async () => {
  beforeAll(async () => {
    await ah.start()
    await ah.api.models.member_families.destroy({where: {}, force: true})
    await ah.api.models.payment.destroy({where: {}, force: true})
    await ah.api.models.member.destroy({where: {}, force: true})
  })

  afterAll(ah.stop)

  afterEach(async () => {
    await ah.api.models.member_families.destroy({where: {}, force: true})
    await ah.api.models.payment.destroy({where: {}, force: true})
    await ah.api.models.member.destroy({where: {}, force: true})
  })

  test('should match master member', async () => {
    // create master member
    const master = await ah.api.models.member.create(generateMember({cardId: 1000}))
    // create family member
    await ah.api.models.member.create(generateMember({cardId: 1001}))

    const input = {
      cardId: 1000,
      familyCardId: 1001
    }

    const processed = await processFamily(input)
    expect(processed.memberId).toEqual(master.id)
  })

  test('should match family member', async () => {
    // create master member
    await ah.api.models.member.create(generateMember({cardId: 1000}))
    // create family member
    const familyMember = await ah.api.models.member.create(generateMember({cardId: 1001}))

    const input = {
      cardId: 1000,
      familyCardId: 1001
    }

    const processed = await processFamily(input)
    expect(processed.familyMemberId).toEqual(familyMember.id)
  })

  test('should fail on missing family member', async () => {
    // create master member
    await ah.api.models.member.create(generateMember({cardId: 1000}))

    const input = {
      cardId: 1000,
      familyCardId: 1001
    }

    expect.assertions(1)
    expect(processFamily(input)).rejects.toThrowErrorMatchingSnapshot()
  })

  test('should fail if master and family are the same member', async () => {
    // create master member
    await ah.api.models.member.create(generateMember({cardId: 1000}))

    const input = {
      cardId: 1000,
      familyCardId: 1000
    }

    expect.assertions(1)
    await expect(processFamily(input)).rejects.toThrowErrorMatchingSnapshot()
  })

  test('should fail on missing master member', async () => {
    // create family member
    await ah.api.models.member.create(generateMember({cardId: 1001}))

    const input = {
      cardId: 1000,
      familyCardId: 1001
    }

    expect.assertions(1)
    expect(processFamily(input)).rejects.toThrowErrorMatchingSnapshot()
  })

  test('should remind that the code depends on member.cardId unique constraint', async () => {
    await ah.api.models.member.create(generateMember({cardId: 1001}))
    expect(ah.api.models.member.create(generateMember({cardId: 1001}))).rejects.toThrowErrorMatchingSnapshot()
  })
})
