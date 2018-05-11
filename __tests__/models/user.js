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

  describe('#username', () => {
    test('should fail when saving without an username', async () => {
      expect.assertions(1)
      user.username = ''
      try {
        await user.save()
      } catch (e) {
        expect(e).toBeDefined()
      }
    })
  })

  describe('#name', () => {
    test('should contain full name', () => {
      expect(user.name).toEqual('Fake User')
    })

    test('should contain only first name if no last name', () => {
      user.lastName = ''
      expect(user.name).toEqual('Fake')
    })

    test('should contain only last name if no first name', () => {
      user.firstName = ''
      expect(user.name).toEqual('User')
    })
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

    test('should update password', async () => {
      expect.assertions(1)
      user.password = 'new secret'
      await user.save()
      await expect(user.authenticate('new secret')).resolves.toBeTruthy()
    })

    test('should hash password when bulk creating', async () => {
      expect.assertions(3)
      const users = await api.models.user.bulkCreate([ 1, 2 ].map((dummy, idx) => {
        const u = genUser().toJSON()
        u.username += `${idx}`
        u.email += `${idx}`
        u.password = `secret${idx}`
        return u
      }))
      expect(users).toHaveLength(2)
      await Promise.all(users.map(async (user, idx) => {
        return expect(user.authenticate(`secret${idx}`)).resolves.toBeTruthy()
      }))
    })
  })

  describe('#resetToken', () => {
    beforeEach(async () => user.save())

    test('should not have one initially', () => {
      expect(user.resetToken).toBeFalsy()
    })

    test('should generate when requested', async () => {
      expect.assertions(1)
      await expect(user.createResetToken()).resolves.toBeTruthy()
    })

    test('should validate if valid', async () => {
      expect.assertions(1)
      const token = await user.createResetToken()
      await expect(user.checkResetToken(token)).resolves.toBeTruthy()
    })

    test('should not validate if not valid', async () => {
      expect.assertions(1)
      await user.createResetToken()
      await expect(user.checkResetToken('bleh')).resolves.toBeFalsy()
    })

    test('should not validate if not generated', async () => {
      expect.assertions(1)
      await expect(user.checkResetToken(user.resetToken)).resolves.toBeFalsy()
    })

    test('should not validate if expired', async () => {
      expect.assertions(1)
      const token = await user.createResetToken()
      user.resetTokenTime -= 900001
      await expect(user.checkResetToken(token)).resolves.toBeFalsy()
    })

    test('should allow authentication if token is generated', async () => {
      expect.assertions(1)
      await user.createResetToken()
      await expect(user.authenticate('secret')).resolves.toBeTruthy()
    })

    test('should not validate if successfully authenticated', async () => {
      expect.assertions(1)
      const token = await user.createResetToken()
      await user.authenticate('secret')
      await expect(user.checkResetToken(token)).resolves.toBeFalsy()
    })
  })

  describe('#authenticate', () => {
    beforeEach(async () => user.save())

    test('should clear resetToken if successful', async () => {
      await user.createResetToken()
      await user.authenticate('secret')
      expect(user.resetToken).toBeFalsy()
    })

    test('should update last login date if successful', async () => {
      user.lastLoginAt = null
      await user.authenticate('secret')
      expect(user.lastLoginAt.getTime()).toBeLessThanOrEqual(new Date().getTime())
      expect(user.lastLoginAt.getTime()).toBeGreaterThanOrEqual(new Date().getTime() - 100)
    })
  })

  describe('#toJSON()', () => {
    test('should not contain password', () => {
      expect(user.toJSON()).not.toHaveProperty('password')
    })

    test('should not contain resetToken', () => {
      expect(user.toJSON()).not.toHaveProperty('resetToken')
    })
  })
})
