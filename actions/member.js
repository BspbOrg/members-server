'use strict'

const { api, Action } = require('actionhero')

exports.list = class List extends Action {
  constructor () {
    super()
    this.name = 'member:list'
    this.description = 'List Members. Requires admin role'
    this.middleware = [ 'auth.hasRole.admin' ]
    this.inputs = {
      limit: { default: 20 },
      offset: { default: 0 }
    }
  }

  async run ({ params, response }) {
    const res = await api.models.member.findAndCountAll({
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
    this.name = 'member:destroy'
    this.description = 'Delete member. Requires admin role'
    this.middleware = [ 'auth.hasRole.admin', 'member.params' ]
    this.inputs = { memberId: { required: true } }
  }

  async run ({ member, response }) {
    response.success = false
    await member.destroy()
    response.success = true
  }
}

exports.show = class Show extends Action {
  constructor () {
    super()
    this.name = 'member:show'
    this.description = 'Retrieve information regarding specific member'
    this.middleware = [ 'auth.hasRole.admin', 'member.params' ]
    this.inputs = { memberId: { required: true } }
  }

  async run ({ member, response }) {
    response.success = false
    response.data = await member.toJSON()
    response.success = true
  }
}

exports.update = class Update extends Action {
  constructor () {
    super()
    this.name = 'member:update'
    this.description = 'Update member info'
    this.middleware = [ 'auth.hasRole.admin', 'member.params' ]
    this.inputs = {
      memberId: { required: true },
      firstName: {},
      middleName: {},
      lastName: {},
      username: {},
      email: {},
      accessId: {},
      cardId: {},
      country: {},
      city: {},
      postalCode: {},
      address: {},
      phone: {},
      category: {}
    }
  }

  async run ({ params, response, member }) {
    response.success = false
    await member.updateAttributes(params)
    response.data = member.toJSON()
    response.success = true
  }
}

exports.create = class Create extends Action {
  constructor () {
    super()
    this.name = 'member:create'
    this.description = 'Create member'
    this.middleware = [ 'auth.hasRole.admin' ]
    this.inputs = {
      firstName: {required: true},
      middleName: {},
      lastName: {required: true},
      category: {},
      username: {},
      email: {},
      accessId: {},
      cardId: {},
      country: {},
      city: {},
      postalCode: {},
      address: {},
      phone: {}
    }
  }

  async run ({ params, response }) {
    response.success = false
    const member = await api.models.member.create(params)
    response.data = member.toJSON()
    response.success = true
  }
}
