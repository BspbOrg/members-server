// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ActionHero = require('actionhero')
const actionhero = new ActionHero.Process()
let api
let user
let mockHasRoleAdmin
let mockIsAuthenticated

describe('action user', () => {
  beforeAll(async () => {
    api = await actionhero.start()
    await api.models.user.sync()
    api.models.user.destroy({ where: {}, force: true })

    user = api.models.user.build({
      username: 'test',
      email: 'test@bspb.org',
      password: 'secret',
      firstName: 'Test',
      lastName: 'User'
    })

    return user.save()
  })
  afterAll(async () => {
    user.destroy({ where: {}, force: true })
    await actionhero.stop()
  })

  beforeEach(() => {
    mockHasRoleAdmin = jest.fn().mockName('auth.hasRole.admin')
    api.actions.addMiddleware({ name: 'auth.hasRole.admin', preProcessor: mockHasRoleAdmin })
    mockIsAuthenticated = jest.fn().mockName('auth.isAuthenticated')
    mockIsAuthenticated.mockImplementation(data => { data.session = { user } })
    api.actions.addMiddleware({ name: 'auth.isAuthenticated', preProcessor: mockIsAuthenticated })
  })

  describe('#list', () => {
    test('should require admin role', async () => {
      await api.specHelper.runAction('user:list')
      expect(mockHasRoleAdmin).toHaveBeenCalled()
    })

    test('should return list of users', async () => {
      const res = await api.specHelper.runAction('user:list')
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
        const records = (Array.apply(null, { length: 100 })).map((dummy, idx) => {
          return {
            username: `test${idx}`,
            email: `test${idx}@bspb.org`,
            password: 'secret',
            firstName: `Test${idx}`,
            lastName: `User${idx}`
          }
        })
        await api.models.user.bulkCreate(records)
      })

      test('should return only 20 records', async () => {
        const res = await api.specHelper.runAction('user:list')
        expect(res.data).toHaveLength(20)
      })

      test('should return only specified records', async () => {
        const res = await api.specHelper.runAction('user:list', { limit: 30 })
        expect(res.data).toHaveLength(30)
      })

      test('should return different records with offset', async () => {
        expect.assertions(20)
        const first = await api.specHelper.runAction('user:list', { limit: 20 })
        const res = await api.specHelper.runAction('user:list', { offset: 20 })
        first.data.forEach(u => expect(res.data).not.toContainEqual(u))
      })
    })
  })

  describe('#destroy', () => {
    test('should require admin role', async () => {
      await api.specHelper.runAction('user:destroy')
      expect(mockHasRoleAdmin).toHaveBeenCalled()
    })
  })

  describe('#me', () => {
    test('should require authenticated user', async () => {
      await api.specHelper.runAction('user:me')
      expect(mockIsAuthenticated).toHaveBeenCalled()
      expect(mockHasRoleAdmin).not.toHaveBeenCalled()
    })

    test('should respond with a user profile when authenticated', async () => {
      const res = await api.specHelper.runAction('user:me')
      expect(res).toHaveProperty('data', expect.objectContaining({ id: user.id }))
    })

    test('should respond with error when not authenticated', async () => {
      mockIsAuthenticated.mockImplementation(() => { throw new Error('Unauthenticated') })
      const res = await api.specHelper.runAction('user:me')
      expect(res).not.toHaveProperty('data')
      expect(res).toHaveProperty('error', expect.stringContaining('Unauthenticated'))
    })
  })

  describe('#changePassword', () => {
    test('should require authenticated user', async () => {
      await api.specHelper.runAction('user:changePassword')
      expect(mockIsAuthenticated).toHaveBeenCalled()
      expect(mockHasRoleAdmin).not.toHaveBeenCalled()
    })
  })

  describe('#show', () => {
    test('should require authenticated user', async () => {
      await api.specHelper.runAction('user:show')
      expect(mockIsAuthenticated).toHaveBeenCalled()
      expect(mockHasRoleAdmin).not.toHaveBeenCalled()
    })
  })
})
