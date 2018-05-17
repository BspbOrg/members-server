const ActionHero = require('actionhero')
const actionhero = new ActionHero.Process()
const { assign } = Object

const ah = module.exports = {
  api: undefined,
  userToken: undefined,
  adminToken: undefined,
  userConnection: undefined,
  adminConnection: undefined,
  userAuth: { email: 'user@bspb.org', password: 'secret' },
  adminAuth: { email: 'admin@bspb.org', password: 'secret' },
  start: async () => {
    ah.api = await actionhero.start()
    ah.userConnection = new ah.api.specHelper.Connection()
    ah.adminConnection = new ah.api.specHelper.Connection()
  },
  stop: async () => {
    await actionhero.stop()
  },
  runAction: async (action, params, token, connection) => {
    if (!connection) connection = new ah.api.specHelper.Connection()
    connection.params = params || {}
    if (token) {
      connection.params = assign({}, connection.params, { csrfToken: token })
    }
    return ah.api.specHelper.runAction(action, connection)
  },
  login: async (auth, connection) => {
    return ah.runAction('session:auth', auth, null, connection)
  },
  loginUser: async () => {
    ah.userToken = (await ah.login(ah.userAuth, ah.userConnection)).token
  },
  loginAdmin: async () => {
    ah.adminToken = (await ah.login(ah.adminAuth, ah.adminConnection)).token
  },
  runUserAction: async (action, params) => {
    if (!ah.userToken) await ah.loginUser()
    return ah.runAction(action, params, ah.userToken, ah.userConnection)
  },
  runAdminAction: async (action, params) => {
    if (!ah.adminToken) await ah.loginAdmin()
    return ah.runAction(action, params, ah.adminToken, ah.adminConnection)
  }
}
