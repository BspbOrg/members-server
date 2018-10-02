// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')

describe('initializer generators', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  test('generates new id', async () => {
    expect(await ah.api.cardId.generateId()).toBeTruthy()
  })

  test('generates different ids', async () => {
    const id1 = await ah.api.cardId.generateId()
    const id2 = await ah.api.cardId.generateId()
    expect(id1).not.toEqual(id2)
  })
})
