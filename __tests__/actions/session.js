// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ActionHero = require('actionhero')
const actionhero = new ActionHero.Process()
let api

const auth = {
  email: 'test@bspb.org',
  password: 'secret'
}

describe('action session', () => {
  beforeAll(async () => {
    api = await actionhero.start()
  })
  afterAll(async () => {
    await actionhero.stop()
  })

  describe('#auth', function () {
    describe('on successful auth', () => {
      let response

      beforeAll(async () => {
        response = await api.specHelper.runAction('session:auth', auth)
      })

      test('should return token', async () => {
        expect(response).toHaveProperty('token', expect.any(String))
      })

      test('should return user info', async () => {
        expect(response).toHaveProperty('data', expect.objectContaining({
          username: 'test',
          email: expect.any(String),
          firstName: expect.any(String),
          lastName: expect.any(String)
        }))
      })

      test('should not return user credentials', async () => {
        expect(response).not.toHaveProperty('data.password')
        expect(response).not.toHaveProperty('data.resetToken')
      })

      test('should return success=true', async () => {
        expect(response).toHaveProperty('success', true)
      })
    })

    test('should return error on unknown username', async () => {
      const res = await api.specHelper.runAction('session:auth', { email: 'unknown', password: 'secret' })
      expect(res).not.toHaveProperty('token')
      expect(res).toHaveProperty('error', expect.any(String))
    })

    test('should return error on wrong password', async () => {
      const res = await api.specHelper.runAction('session:auth', { email: 'test', password: 'wrong' })
      expect(res).not.toHaveProperty('token')
      expect(res).toHaveProperty('error', expect.any(String))
    })
  })
})
