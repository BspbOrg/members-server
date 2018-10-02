const crypto = require('crypto')
const util = require('util')
const { Initializer, api } = require('actionhero')

module.exports = class SessionInitializer extends Initializer {
  constructor () {
    super()
    this.name = 'session'
  }

  async initialize () {
    const redis = api.redis.clients.client

    api.session = {
      prefix: 'session:',

      sessionKey: (connection) => api.session.prefix + connection.fingerprint,

      load: async (connection) => {
        const key = api.session.sessionKey(connection)
        const data = await redis.get(key)
        if (!data) return false
        return JSON.parse(data)
      },

      create: async (connection, user) => {
        const key = api.session.sessionKey(connection)
        const randomBuffer = await util.promisify(crypto.randomBytes)(64)
        const csrfToken = randomBuffer.toString('hex')

        const sessionData = {
          userId: user.id,
          role: user.role,
          csrfToken: csrfToken,
          sesionCreatedAt: new Date().getTime()
        }

        await user.updateAttributes({
          lastLoginAt: new Date(),
          resetToken: null,
          resetTokenTime: null
        })
        await redis.set(key, JSON.stringify(sessionData))
        await redis.expire(key, api.config.auth.sessionTtl)
        return sessionData
      },

      destroy: async (connection) => {
        const key = api.session.sessionKey(connection)
        await redis.del(key)
      },

      middleware: {
        session: {
          name: 'session',
          global: false,
          priority: 1000,
          preProcessor: async (data) => {
            if ('session' in data) return
            data.session = null
            const sessionData = await api.session.load(data.connection)
            if (!sessionData) return

            data.session = sessionData
            const key = api.session.sessionKey(data.connection)
            await redis.expire(key, api.config.auth.sessionTtl)
          }
        },
        auth: {
          name: 'auth.isAuthenticated',
          global: false,
          priority: 2000,
          preProcessor: async (data) => {
            await api.session.middleware.session.preProcessor(data)
            if (data.session) return
            data.connection.rawConnection.responseHttpCode = 401
            throw new Error('Please log in to continue')
          }
        },
        csrf: {
          name: 'csrf',
          global: false,
          priority: 2500,
          preProcessor: async (data) => {
            await api.session.middleware.auth.preProcessor(data)
            const { session, connection: { rawConnection }, params } = data

            let csrfToken

            if (!csrfToken &&
              rawConnection &&
              rawConnection.req &&
              rawConnection.req.headers &&
              rawConnection.req.headers['x-csrf-token']) {
              csrfToken = rawConnection.req.headers['x-csrf-token']
            }

            if (!csrfToken &&
              rawConnection.cookies &&
              rawConnection.cookies['csrf-token']) {
              csrfToken = rawConnection.cookies['csrf-token']
            }

            if (!csrfToken &&
              params &&
              params.csrfToken) {
              csrfToken = params.csrfToken
            }

            if (!csrfToken) {
              throw new Error('Missing CSRF')
            }
            if (csrfToken !== session.csrfToken) {
              throw new Error('CSRF error')
            }
          }
        },
        user: {
          name: 'auth.hasRole.user',
          global: false,
          priority: 3000,
          preProcessor: async (data) => {
            await api.session.middleware.auth.preProcessor(data)
            if (data.session.role === 'user') return
            data.connection.rawConnection.responseHttpCode = 403
            throw new Error('User required')
          }
        },
        admin: {
          name: 'auth.hasRole.admin',
          global: false,
          priority: 3000,
          preProcessor: async (data) => {
            await api.session.middleware.auth.preProcessor(data)
            if (data.session.role === 'admin') return
            data.connection.rawConnection.responseHttpCode = 403
            throw new Error('Admin required')
          }
        },
        owner: {
          name: 'auth.hasRole.admin or auth.user == user',
          global: false,
          priority: 20000,
          preProcessor: async (data) => {
            if (!data.user) throw new Error('No user specified in input')
            await api.session.middleware.auth.preProcessor(data)
            if (data.session.userId === data.user.id) return
            await api.session.middleware.admin.preProcessor(data)
          }
        }
      }
    }

    api.actions.addMiddleware(api.session.middleware.session)
    api.actions.addMiddleware(api.session.middleware.csrf)
    api.actions.addMiddleware(api.session.middleware.auth)
    api.actions.addMiddleware(api.session.middleware.user)
    api.actions.addMiddleware(api.session.middleware.admin)
    api.actions.addMiddleware(api.session.middleware.owner)

    api.params.globalSafeParams.push('csrfToken')
  }
}
