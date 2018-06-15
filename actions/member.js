'use strict'

const { api, Action } = require('actionhero')

exports.list = class List extends Action {
  constructor () {
    super()
    this.name = 'member:list'
    this.description = 'List Members. Requires admin role'
    this.middleware = [ 'auth.hasRole.admin', 'paging' ]
    this.inputs = {
      limit: {},
      offset: {}
    }
  }

  async run ({ params, response }) {
    const res = await api.models.member.findAndCountAll({
      offset: params.offset,
      limit: params.limit,
      include: [ 'familyMembers' ]
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

exports.Show = class Show extends Action {
  constructor () {
    super()
    this.name = 'member:show'
    this.description = 'Retrieve information regarding specific member'
    this.middleware = [ 'auth.hasRole.admin', 'member.params' ]
    this.inputs = { memberId: { required: true } }
  }

  async run ({ member, response }) {
    response.success = false
    response.data = member.toJSON()
    const familyMembers = await member.getFamilyMembers()
    response.data.familyMembers = familyMembers.map(m => m.toJSON())
    response.success = true
  }
}

exports.update = class Update extends exports.Show {
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
      category: {},
      familyMembers: {}
    }
  }

  async run ({ params, response, member }) {
    response.success = false
    await member.updateAttributes(params)
    if (params.familyMembers) {
      await member.setFamilyMembers(params.familyMembers)
    }
    return super.run(arguments[0])
  }
}

exports.create = class Create extends exports.Show {
  constructor () {
    super()
    this.name = 'member:create'
    this.description = 'Create member'
    this.middleware = [ 'auth.hasRole.admin' ]
    this.inputs = {
      firstName: { required: true },
      middleName: {},
      lastName: { required: true },
      category: {},
      username: {},
      email: {},
      accessId: {},
      cardId: {},
      country: {},
      city: {},
      postalCode: {},
      address: {},
      phone: {},
      familyMembers: {}
    }
  }

  async run ({ member, params, response }) {
    response.success = false
    member = arguments[0].member = await api.models.member.create(params)
    if (params.familyMembers) {
      await member.setFamilyMembers(params.familyMembers)
    }
    return super.run(arguments[0])
  }
}
