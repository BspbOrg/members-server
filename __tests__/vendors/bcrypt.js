// eslint-disable-next-line no-unused-vars
/* globals describe, beforeAll, afterAll, before, after, test, expect, jest */
const bcrypt = require('bcryptjs')
const config = require('../../config/auth').test.auth()

describe('bcrypt dependency', () => {
  test('generates salt', async () => {
    const salt = await bcrypt.genSalt(config.bcryptComplexity)
    expect(salt).toBeTruthy()
    expect(salt.length).toBeGreaterThanOrEqual(16)
  })

  test('encrypts password', async () => {
    const salt = await bcrypt.genSalt(config.bcryptComplexity)
    const password = await bcrypt.hash('abc', salt)
    expect(password).toBeTruthy()
    expect(password.length).toBeGreaterThanOrEqual(24)
  })

  test('compares same password', async () => {
    const salt = await bcrypt.genSalt(config.bcryptComplexity)
    const password = await bcrypt.hash('password', salt)
    const same = await bcrypt.compare('password', password)
    expect(same).toBe(true)
  })

  test('compares same password', async () => {
    const salt = await bcrypt.genSalt(config.bcryptComplexity)
    const password = await bcrypt.hash('password', salt)
    const same = await bcrypt.compare('not password', password)
    expect(same).toBe(false)
  })
})
