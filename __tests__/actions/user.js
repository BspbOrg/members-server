// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const { snapshot, testActionPermissions, testFieldChange } = require('../../test/helpers')
const { assign } = Object
const { generateUser } = require('../../test/generators')

describe('action user', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  describe('#list', () => {
    const action = 'user:list'

    testActionPermissions(action, {}, { guest: false, user: false, admin: true })

    test('should return list of users', async () => {
      const user = await ah.api.models.user.findOne({})
      const res = await ah.runAdminAction(action)
      expect(res).toHaveProperty('data', expect.arrayContaining([
        expect.objectContaining({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email
        })
      ]))
    })

    describe('with many records', () => {
      beforeAll(async () => {
        const records = (Array.apply(null, { length: 100 })).map(() => {
          return generateUser({ firstName: 'TEMPORARY' })
        })
        await ah.api.models.user.bulkCreate(records)
      })

      afterAll(async () => {
        ah.api.models.user.destroy({ where: { firstName: 'TEMPORARY' }, force: true })
      })

      test('should return only 20 records', async () => {
        expect((await ah.runAdminAction(action)).data).toHaveLength(20)
      })

      test('should return only specified records', async () => {
        expect((await ah.runAdminAction(action, { limit: 30 })).data).toHaveLength(30)
      })

      test('should return different records with offset', async () => {
        expect.assertions(20)
        const first = await ah.runAdminAction(action, { limit: 20 })
        const res = await ah.runAdminAction(action, { offset: 20 })
        first.data.forEach(u => expect(res.data).not.toContainEqual(u))
      })
    })
  })

  describe('#destroy', () => {
    let user
    const action = 'user:destroy'
    const params = async () => { return { userId: user.id } }

    beforeEach(async () => {
      user = await ah.api.models.user.create(generateUser())
    })

    afterEach(async () => {
      await ah.api.models.user.destroy({ where: { id: user.id }, force: true })
    })

    testActionPermissions(action, params, { guest: false, user: false, admin: true })
  })

  describe('#me', () => {
    const action = 'user:me'

    testActionPermissions(action, {}, { guest: false, user: true, admin: true })

    test('should respond with an user profile when authenticated', async () => {
      const response = await ah.runUserAction(action)
      expect(response).toHaveProperty('data')
      snapshot(response.data)
    })

    test('should respond with an admin profile when authenticated', async () => {
      const response = await ah.runAdminAction(action)
      expect(response).toHaveProperty('data')
      snapshot(response.data)
    })
  })

  describe('#changePassword', () => {
    const action = 'user:changePassword'
    const params = { oldPassword: 'secret', newPassword: 'new secret' }

    testActionPermissions(action, params, { guest: false, user: true, admin: true })
  })

  describe('#show', () => {
    const action = 'user:show'
    const params = async () => { return { userId: (await ah.api.models.user.findOne({})).id } }

    testActionPermissions(action, params, { guest: false, user: false, admin: true })
  })

  describe('#update self', () => {
    const action = 'user:update'
    const params = async () => {
      const user = (await ah.runUserAction('user:me')).data
      if (!user) return {}
      return assign({ userId: user.id }, user)
    }

    testActionPermissions(action, params, { guest: false, user: true, admin: true })
  })

  describe('#update', () => {
    let user
    const action = 'user:update'
    const params = async () => { return assign({ userId: user.id }, generateUser()) }

    beforeEach(async () => {
      user = await ah.api.models.user.create(generateUser())
    })

    afterEach(async () => {
      await ah.api.models.user.destroy({ where: { id: user.id }, force: true })
    })

    testActionPermissions(action, params, { guest: false, user: false, admin: true })

    testFieldChange('user:show', () => { return { userId: user.id } }, action, params, 'firstName')
    testFieldChange('user:show', () => { return { userId: user.id } }, action, params, 'lastName')
    testFieldChange('user:show', () => { return { userId: user.id } }, action, params, 'username')
    testFieldChange('user:show', () => { return { userId: user.id } }, action, params, 'email')
  })
})
