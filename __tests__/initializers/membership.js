// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const Membership = require('../../classes/Membership')

describe('initializer membership', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  test('membership to be defined', async () => {
    expect(await ah.api.membership).toBeInstanceOf(Membership)
  })

  test('membership have been intialized with correct configuration', async () => {
    expect(ah.api.membership.config).toBe(ah.api.config.membership)
  })
})
