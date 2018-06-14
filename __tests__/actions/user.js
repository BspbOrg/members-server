// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const { snapshot, testActionPermissions, testFieldChange, testPaging } = require('../../test/helpers')
const { assign } = Object
const { generateUser } = require('../../test/generators')
const omit = require('lodash.omit')

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

    testPaging(action, 'user', () => {
      return generateUser({ firstName: 'TEMPORARY' })
    }, { firstName: 'TEMPORARY' })
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
    const params = async () => { return assign({ userId: user.id }, generateUser({ language: 'en', role: 'user' })) }

    beforeEach(async () => {
      user = await ah.api.models.user.create(generateUser({ language: 'bg', role: 'admin' }))
    })

    afterEach(async () => {
      await ah.api.models.user.destroy({ where: { id: user.id }, force: true })
    })

    testActionPermissions(action, params, { guest: false, user: false, admin: true })

    const fields = [
      'firstName', 'lastName', 'username', 'email', 'language', 'role'
    ]
    fields.forEach(field =>
      testFieldChange(
        // get request
        'user:show', () => { return { userId: user.id } },
        // update request
        action, params,
        // field that should change
        field)
    )
  })

  describe('#create', () => {
    const action = 'user:create'
    const params = generateUser({ firstName: 'TEMPORARY' })

    afterEach(async () => {
      ah.api.models.user.destroy({ where: { firstName: 'TEMPORARY' }, force: true })
    })

    testActionPermissions(action, params, { guest: false, user: false, admin: true })

    describe('when created new user', () => {
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
          getResponse = await ah.runAdminAction('user:show', { userId: response.data.id })
        })

        test('should succeed', async () => {
          expect(getResponse).toBeSuccessAction()
        })

        test('should have the provided properties', async () => {
          expect(getResponse.data).toEqual(expect.objectContaining(omit(params, [ 'password' ])))
        })
      })
    })
  })
})
