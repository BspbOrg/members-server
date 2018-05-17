'use strict'

const { api, Action } = require('actionhero')

exports.list = class List extends Action {
  constructor () {
    super()
    this.name = 'user:list'
    this.description = 'List users. Requires admin role'
    this.outputExample = [
      { id: 1, firstName: 'Test', lastName: 'Admin', username: 'admin', email: 'admin@bspb.org' },
      { id: 2, firstName: 'Test', lastName: 'User', username: 'test', email: 'test@bspb.org' }
    ]
    this.middleware = [ 'auth.hasRole.admin' ]
    this.inputs = {
      limit: { default: 20 },
      offset: { default: 0 }
    }
  }

  async run ({ params, response }) {
    const res = await api.models.user.findAndCountAll({
      attributes: [ 'id', 'firstName', 'lastName', 'username', 'email', 'role' ],
      offset: params.offset,
      limit: params.limit
    })
    response.data = await Promise.all(res.rows.map(u => u.toJSON()))
    response.count = res.count
  }
}

exports.destroy = class Destroy extends Action {
  constructor () {
    super()
    this.name = 'user:destroy'
    this.description = 'Delete user. Requires admin role'
    this.middleware = [ 'auth.hasRole.admin', 'user.params' ]
    this.inputs = { userId: { required: true } }
  }

  async run ({ user, response }) {
    response.success = false
    await user.destroy()
    response.success = true
  }
}

exports.me = class Me extends Action {
  constructor () {
    super()
    this.name = 'user:me'
    this.description = 'Return information about the currently authenticated user'
    this.outputExample = {
      id: 1,
      firstName: 'Test',
      lastName: 'Admin',
      username: 'admin',
      email: 'admin@bspb.org'
    }
    this.middleware = [ 'auth.isAuthenticated', 'user.session' ]
  }

  async run ({ user, response }) {
    response.success = false
    response.data = await user.toJSON()
    response.success = true
  }
}

exports.changePassword = class ChangePassword extends Action {
  constructor () {
    super()
    this.name = 'user:changePassword'
    this.description = 'Update password for the currently authenticated user'
    this.middleware = [ 'auth.isAuthenticated', 'user.session' ]
    this.inputs = {
      oldPassword: { required: true },
      newPassword: { required: true }
    }
  }

  async run ({ params: { oldPassword, newPassword }, response, user }) {
    response.success = false

    if (!await user.validatePassword(newPassword)) throw new Error('Invalid password')
    if (!await user.checkPassword(oldPassword)) throw new Error('Wrong password')

    await user.updateAttributes({ password: newPassword })

    response.success = true
  }
}

exports.show = class Show extends Action {
  constructor () {
    super()
    this.name = 'user:show'
    this.description = 'Retrieve information regarding specific user'
    this.outputExample = {
      id: 1,
      firstName: 'Test',
      lastName: 'Admin',
      username: 'admin',
      email: 'admin@bspb.org'
    }
    this.middleware = [ 'auth.hasRole.admin', 'user.params' ]
    this.inputs = { userId: { required: true } }
  }

  async run ({ user, response }) {
    response.success = false
    response.data = await user.toJSON()
    response.success = true
  }
}
