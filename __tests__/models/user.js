// eslint-disable-next-line no-unused-vars
/* globals describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ActionHero = require('actionhero')
const actionhero = new ActionHero.Process()
let api
let user

const genUser = function () {
  user = api.models.user.build({
    username: 'fake',
    firstName: 'Fake',
    lastName: 'User',
    email: 'fake@bspb.org',
    password: 'secret'
  })
  return user
}

describe('model user', () => {
  beforeAll(async () => {
    api = await actionhero.start()
    await api.models.user.sync()
    api.models.user.destroy({ where: {}, force: true })
  })
  afterAll(async () => { await actionhero.stop() })
  beforeEach(async () => { genUser() })
  afterEach(async () => { api.models.user.destroy({ where: {}, force: true }) })

  test('should begin with no users', async () => {
    expect.assertions(1)
    await expect(api.models.user.findAll()).resolves.toHaveLength(0)
  })

  test('should fail when saving a duplicate user', async () => {
    expect.assertions(1)
    await user.save()
    try {
      await genUser().save()
    } catch (e) {
      expect(e).toBeDefined()
    }
  })

  describe('#email', () => {
    test('should fail when saving without an email', async () => {
      expect.assertions(1)
      user.email = ''
      try {
        await user.save()
      } catch (e) {
        expect(e).toBeDefined()
      }
    })
  })

  describe('#password', () => {
    beforeEach(async () => user.save())

    test('should exclude salt and hashedPassword by default', async () => {
      const _user = await api.models.user.find({ name: user.name })
      expect(_user).toHaveProperty('password')
      expect(_user.password).not.toEqual('secret')
      expect(_user).not.toHaveProperty('hashedPassword')
    })

    test('should authenticate user if valid', async () => {
      expect.assertions(1)
      await expect(user.authenticate('secret')).resolves.toBeTruthy()
    })

    test('should not authenticate user if invalid', async () => {
      expect.assertions(1)
      await expect(user.authenticate('blah')).resolves.not.toBeTruthy()
    })

    test('should remain the same hash unless the password is updated', async () => {
      expect.assertions(1)
      user.firstName = 'Test'
      await user.save()
      await expect(user.authenticate('secret')).resolves.toBeTruthy()
    })
  })
})
