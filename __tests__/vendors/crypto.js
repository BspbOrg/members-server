// eslint-disable-next-line no-unused-vars
/* globals describe, beforeAll, afterAll, before, after, test, expect, jest */
const crypto = require('crypto')
const config = {
  ...require('../../config/auth').default.auth(),
  ...require('../../config/auth').test.auth()
}
const util = require('util')

describe('crypto dependency', () => {
  test('generates random bytes', async () => {
    const buf = await util.promisify(crypto.randomBytes)(config.resetTokenBytes)
    const pwToken = buf.toString('hex')
    expect(pwToken).toBeTruthy()
    expect(pwToken.length).toBe(config.resetTokenBytes * 2)
  })
})
