// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ActionHero = require('actionhero')
const actionhero = new ActionHero.Process()
let api

describe('action session', () => {
  beforeAll(async () => {
    api = await actionhero.start()
  })
  afterAll(async () => {
    await actionhero.stop()
  })

  describe('#auth', function () {
    test('should return token on successful auth', async () => {
      const res = await api.specHelper.runAction('session:auth', { username: 'test', password: 'secret' })
      expect(res).toHaveProperty('token', expect.any(String))
    })

    test('should return user info on successful auth', async () => {
      const res = await api.specHelper.runAction('session:auth', { username: 'test', password: 'secret' })
      expect(res).toHaveProperty('data', expect.objectContaining({
        username: 'test',
        email: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String)
      }))
    })

    test('should not return user credentials on successful auth', async () => {
      const res = await api.specHelper.runAction('session:auth', { username: 'test', password: 'secret' })
      expect(res).not.toHaveProperty('data.password')
      expect(res).not.toHaveProperty('data.resetToken')
    })

    test('should return error on unknown username', async () => {
      const res = await api.specHelper.runAction('session:auth', { username: 'unknown', password: 'secret' })
      expect(res).not.toHaveProperty('token')
      expect(res).toHaveProperty('error', expect.any(String))
    })

    test('should return error on wrong password', async () => {
      const res = await api.specHelper.runAction('session:auth', { username: 'test', password: 'wrong' })
      expect(res).not.toHaveProperty('token')
      expect(res).toHaveProperty('error', expect.any(String))
    })
  })
})
