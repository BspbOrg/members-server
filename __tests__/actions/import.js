// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const path = require('path')

describe('action import', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  beforeEach(async () => {
    await ah.api.models.payment.destroy({where: {}, force: true})
    await ah.api.models.member.destroy({where: {}, force: true})
  })

  describe('#members', () => {
    const action = 'import:member'
    test('should import members', async () => {
      const params = {
        createNew: true,
        updateExisting: false,
        failOnError: false,
        dryRun: false,
        category: 'regular',
        importFile: {path: path.join('test/files', 'import_members.csv')}
      }
      const res = await ah.runAdminAction(action, params)

      expect(res.data).toEqual(expect.objectContaining({
        totalRows: 3,
        inserts: 3,
        updates: 0,
        errors: 0,
        ignored: 0,
        dryRun: false,
        success: true
      }))

      expect(await ah.api.models.member.count()).toBe(3)
    })
  })
})
