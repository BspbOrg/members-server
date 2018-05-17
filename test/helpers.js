/* globals expect, test */

const ah = require('./ah-setup')
const { assign } = Object

module.exports = {
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
  }
}
