// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const { generateMember } = require('../../test/generators')

describe('action family members', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  let member1
  let member2
  let member3

  beforeEach(async () => {
    member1 = await ah.api.models.member.create(generateMember())
    member2 = await ah.api.models.member.create(generateMember())
    member3 = await ah.api.models.member.create(generateMember())
    await member1.setFamilyMembers([ member2.id ])
  })

  afterEach(async () => {
    await member1.destroy({ force: true })
    await member2.destroy({ force: true })
    await member3.destroy({ force: true })
  })

  test('should have three members', async () => {
    expect.assertions(3)
    expect(await ah.runAdminAction('member:show', { memberId: member1.id })).toBeSuccessAction()
    expect(await ah.runAdminAction('member:show', { memberId: member2.id })).toBeSuccessAction()
    expect(await ah.runAdminAction('member:show', { memberId: member3.id })).toBeSuccessAction()
  })

  describe('#list', () => {
    const action = 'member:list'

    test('should include list of family members', async () => {
      const res = await ah.runAdminAction(action, { limit: 100 })
      expect(res).toHaveProperty('data', expect.arrayContaining([
        expect.objectContaining({
          id: member1.id,
          familyMembers: expect.objectContaining([
            expect.objectContaining({ id: member2.id })
          ])
        })
      ]))
    })
  })

  describe('#show', () => {
    const action = 'member:show'

    test('should include family members', async () => {
      const res = await ah.runAdminAction(action, { memberId: member1.id })
      expect(res).toHaveProperty('data',
        expect.objectContaining({
          familyMembers: expect.objectContaining([
            expect.objectContaining({ id: member2.id })
          ])
        }))
    })
  })

  describe('#update', () => {
    const action = 'member:update'

    test('should update family members', async () => {
      const res = await ah.runAdminAction(action, { memberId: member1.id, familyMembers: [ member3.id ] })
      expect(res).toBeSuccessAction()
      const familyMembers = await member1.getFamilyMembers()
      expect(familyMembers).toEqual(expect.arrayContaining([ expect.objectContaining({ id: member3.id }) ]))
      expect(familyMembers).toHaveLength(1)
    })
  })

  describe('#create', () => {
    const action = 'member:create'

    test('should create with family members', async () => {
      const res = await ah.runAdminAction(action, generateMember({ familyMembers: [ member3.id ] }))
      expect(res).toBeSuccessAction()
      expect(res).toEqual(
        expect.objectContaining({
          data: expect.objectContaining({
            familyMembers: expect.arrayContaining([
              expect.objectContaining({ id: member3.id })
            ])
          })
        })
      )
      expect(res.data.familyMembers).toHaveLength(1)
    })
  })
})
