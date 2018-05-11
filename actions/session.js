'use strict'

const { api, Action } = require('actionhero')

exports.auth = class Auth extends Action {
  constructor () {
    super()
    this.name = 'session:auth'
    this.description = 'Authenticate user with username and password'
    this.outputExample = { data: 'SECURE TOKEN' }
    this.inputs = {
      username: { required: true },
      password: { required: true }
    }
  }

  async run ({ connection, params, response }) {
    let valid = true

    let user
    valid = valid && (user = await api.models.user.findOne({ where: { username: params.username } }))

    valid = valid && (await user.authenticate(params.password))

    if (!valid) {
      throw new Error('Invalid username or password')
    }

    const session = await api.session.create(connection, user)
    response.token = session.csrfToken
    response.data = user.toJSON()
  }
}
