/* globals describe, expect, test, beforeAll, afterAll */

const ah = require('./ah-setup')
const { assign } = Object

function resolveArg (arg) {
  return typeof arg === 'function' ? arg.apply(this, Array.prototype.slice(arguments, 1)) : arg
}

module.exports = {
  resolveArg,
  snapshotSkipFields: [ 'createdAt', 'lastLoginAt', 'updatedAt', 'deletedAt' ],
  testActionPermissions: (action, params, permissions) => {
    for (let role in permissions) {
      if (!permissions.hasOwnProperty(role)) continue
      const allowed = permissions[ role ]
      const upcasedRole = role.toLowerCase() === 'guest' ? '' : role.substr(0, 1).toUpperCase() + role.substr(1).toLowerCase()
      test(`should ${allowed ? 'succeed' : 'fail'} for ${role || 'guest'}`, async () => {
        let p = await params
        if (p instanceof Function) p = await p()

        const runAction = ah[ `run${upcasedRole}Action` ]
        const response = await runAction(action, p)

        if (allowed) {
          expect(response).toBeSuccessAction()
        } else {
          expect(response).toBeFailedAction()
        }
      })
    }
  },
  snapshot: (object, label) => {
    const prepared = assign({}, object)
    module.exports.snapshotSkipFields.forEach(field => {
      if (prepared[ field ]) prepared[ field ] = 'skipped'
    })
    expect(prepared).toMatchSnapshot(label)
  },
  testFieldChange: (getAction, getParams, updateAction, updateParams, field) => {
    test(`should update ${field}`, async () => {
      const getp = await resolveArg(getParams)
      const updatep = await resolveArg(updateParams)

      const original = await ah.runAdminAction(getAction, getp)
      expect(original).toBeSuccessAction()

      const update = await ah.runAdminAction(updateAction, updatep)
      expect(update).toBeSuccessAction()
      expect(update.data[ field ]).not.toEqual(original.data[ field ])

      const updated = await ah.runAdminAction(getAction, getp)
      expect(updated).toBeSuccessAction()
      expect(updated.data[ field ]).not.toEqual(original.data[ field ])

      expect(update.data[ field ]).toEqual(updated.data[ field ])
    })
  },
  testPaging: (action, model, creator) => {
    describe('with many records', () => {
      let records

      beforeAll(async () => {
        records = await Promise.all((Array.apply(null, { length: 3 })).map(resolveArg.bind(null, creator)))
        records = await ah.api.models[ model ].bulkCreate(records)
      })

      afterAll(async () => {
        await Promise.all(records.map(r => r.destroy({ force: true })))
      })

      test('should return only 2 records', async () => {
        expect((await ah.runAdminAction(action)).data).toHaveLength(2)
      })

      test('should return only specified records', async () => {
        expect((await ah.runAdminAction(action, { limit: 1 })).data).toHaveLength(1)
      })

      test('should return different records with offset', async () => {
        expect.assertions(1)
        const first = await ah.runAdminAction(action, { limit: 1 })
        const res = await ah.runAdminAction(action, { offset: 1 })
        first.data.forEach(u => expect(res.data).not.toContainEqual(u))
      })
    })
  },
  testRequiredFields: (model, modelData, requiredFields) => {
    requiredFields.forEach(field => {
      test(`should require ${field}`, async () => {
        const data = assign({}, await resolveArg(modelData))
        delete data[ field ]
        return expect(ah.api.models[ model ].create(data)).rejects.toThrowErrorMatchingSnapshot()
      })
    })
  }
}
