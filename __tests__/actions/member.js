// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const { snapshot, testActionPermissions, testFieldChange } = require('../../test/helpers')
const { assign } = Object
const { generateMember } = require('../../test/generators')

describe('action member', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  describe('#list', () => {
    const action = 'member:list'

    testActionPermissions(action, {}, { guest: false, user: false, admin: true })

    test('should return list of members', async () => {
      const member = await ah.api.models.member.findOne({})
      const res = await ah.runAdminAction(action)
      expect(res).toHaveProperty('data', expect.arrayContaining([
        expect.objectContaining({
          id: member.id,
          firstName: member.firstName,
          middleName: member.middleName,
          lastName: member.lastName,
          username: member.username,
          email: member.email,
          phone: member.phone
        })
      ]))
    })

    describe('with many records', () => {
      beforeAll(async () => {
        const records = (Array.apply(null, { length: 3 })).map(() => {
          return generateMember({ firstName: 'TEMPORARY' })
        })
        await ah.api.models.member.bulkCreate(records)
      })

      afterAll(async () => {
        ah.api.models.member.destroy({ where: { firstName: 'TEMPORARY' }, force: true })
      })

      test('should return only 2 records', async () => {
        expect((await ah.runAdminAction(action)).data).toHaveLength(2)
      })

      test('should return only specified records', async () => {
        expect((await ah.runAdminAction(action, { limit: 1 })).data).toHaveLength(1)
      })

      test('should return different records with offset', async () => {
        expect.assertions(1)
        const first = await ah.runAdminAction(action, { limit: 1 })
        const res = await ah.runAdminAction(action, { offset: 1 })
        first.data.forEach(u => expect(res.data).not.toContainEqual(u))
      })
    })
  })

  describe('#destroy', () => {
    let member
    const action = 'member:destroy'
    const params = async () => { return { memberId: member.id } }

    beforeEach(async () => {
      member = await ah.api.models.member.create(generateMember())
    })

    afterEach(async () => {
      await ah.api.models.member.destroy({ where: { id: member.id }, force: true })
    })

    testActionPermissions(action, params, { guest: false, user: false, admin: true })

    test('should delete from db', async () => {
      await ah.runAdminAction(action, await params())
      const record = await ah.api.models.member.findOne({ where: { id: member.id } })
      expect(record).toBeFalsy()
    })
  })

  describe('#show', () => {
    const action = 'member:show'
    const params = async () => { return { memberId: (await ah.api.models.member.findOne({})).id } }

    testActionPermissions(action, params, { guest: false, user: false, admin: true })

    test('should contain all initial fields', async () => {
      const rawData = generateMember()
      const member = await ah.api.models.member.create(rawData)

      const response = await ah.runAdminAction(action, { memberId: member.id })

      expect(response).toHaveProperty('data', expect.objectContaining(rawData))
    })

    test('should match snapshot', async () => {
      const member = await ah.api.models.member.findOne({ order: [ [ 'id', 'ASC' ] ] })
      const response = await ah.runAdminAction(action, { memberId: member.id })
      snapshot(response.data)
    })
  })

  describe('#update', () => {
    let member
    let updatedParams
    const action = 'member:update'
    const params = async () => { return assign({ memberId: member.id }, updatedParams) }

    beforeEach(async () => {
      member = await ah.api.models.member.create(generateMember())
      updatedParams = generateMember()
      for (let key in updatedParams) {
        if (!updatedParams.hasOwnProperty(key)) continue
        // category is different everytime
        if (key === 'category') continue
        // email could be null and we need to provide valid email
        if (key === 'email' && !updatedParams.email) updatedParams.email = 'old@email.com'
        updatedParams[ key ] = `Updated${updatedParams[ key ]}`
      }
    })

    afterEach(async () => {
      await ah.api.models.member.destroy({ where: { id: member.id }, force: true })
    })

    testActionPermissions(action, params, { guest: false, user: false, admin: true })

    const fields = [
      'firstName', 'middleName', 'lastName', 'username', 'email', 'accessId', 'cardId',
      'country', 'city', 'postalCode', 'address', 'phone', 'category'
    ]
    fields.forEach(field =>
      testFieldChange(
        // get request
        'member:show', () => { return { memberId: member.id } },
        // update request
        action, params,
        // field that should change
        field)
    )
  })

  describe('#create', () => {
    const action = 'member:create'
    const params = generateMember({ firstName: 'TEMPORARY' })

    afterEach(async () => {
      ah.api.models.member.destroy({ where: { firstName: 'TEMPORARY' }, force: true })
    })

    testActionPermissions(action, params, { guest: false, user: false, admin: true })

    describe('when created new member', () => {
      let response
      beforeEach(async () => {
        response = await ah.runAdminAction(action, params)
      })

      test('should assign id', async () => {
        expect(response).toHaveProperty('data.id', expect.anything())
      })

      describe('and later retrieved', async () => {
        let getResponse
        beforeEach(async () => {
          getResponse = await ah.runAdminAction('member:show', { memberId: response.data.id })
        })

        test('should succeed', async () => {
          expect(getResponse).toBeSuccessAction()
        })

        test('should have the provided properties', async () => {
          expect(getResponse.data).toEqual(expect.objectContaining(params))
        })
      })
    })
  })
})
