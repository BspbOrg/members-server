const { Initializer, api } = require('actionhero')

async function resolveUser (userId, data) {
  if (data.user) return

  const { connection: { rawConnection } } = data

  if (!userId) {
    throw new Error('Missing userId')
  }

  data.user = await api.models.user.findOne({ where: { id: userId } })
  if (!data.user) {
    rawConnection.responseHttpCode = 404
    throw new Error('User not found')
  }
}

module.exports = class UserInitializer extends Initializer {
  constructor () {
    super()
    this.name = 'user'
  }

  async initialize () {
    api.actions.addMiddleware({
      name: 'user.params',
      global: false,
      priority: 10000,
      preProcessor: async (data) => {
        const { params: { userId } } = data
        if (!userId) throw new Error('Missing userId in params')
        return resolveUser(userId, data)
      }
    })

    api.actions.addMiddleware({
      name: 'user.session',
      global: false,
      priority: 10000,
      preProcessor: async (data) => {
        const { session: { userId } } = data
        if (!userId) throw new Error('Missing userId in session')
        return resolveUser(userId, data)
      }
    })

    api.actions.addMiddleware({
      name: 'user.paramsOrSession',
      global: false,
      priority: 10000,
      preProcessor: async (data) => {
        const { params: { userId: paramsUserId } } = data
        const { session: { userId: sessionUserId } } = data
        if (!paramsUserId && !sessionUserId) throw new Error('Missing userId in params and session')
        return resolveUser(paramsUserId || sessionUserId, data)
      }
    })
  }
}
