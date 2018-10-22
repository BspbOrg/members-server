'use strict'

const ah = require('../../test/ah-setup')
const omit = require('lodash.omit')

const expectedError = new Error('Invalid options. Must contain template, mail, and locals property')
const params = {
  template: 'register',
  mail: {
    to: 'test@test.tst',
    subject: 'Helllooo'
  },
  locals: { name: 'Dimitar Nikolov' }
}

const run = async (data = {}) => (
  ah.api.specHelper.runTask('sendmail', data)
)

describe('task SendMail:run', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  test('should send email', async () => {
    await run(params)
  })

  test('should detect missing email option', async () => {
    expect(await run(omit(params, ['mail']))).toEqual(expectedError)
  })

  test('should detect missing locals option', async () => {
    expect(await run(omit(params, ['locals']))).toEqual(expectedError)
  })

  test('should detect missing template option', async () => {
    expect(await run(omit(params, ['template']))).toEqual(expectedError)
  })
})
