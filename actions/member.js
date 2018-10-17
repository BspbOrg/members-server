'use strict'

const { api, Action } = require('actionhero')
const { Op } = require('sequelize')

const QUERY_FIELDS = [
  'username', 'firstName', 'middleName', 'lastName', 'email', 'phone', 'accessId', 'cardId', 'country',
  'city', 'postalCode', 'address'
]

class List extends Action {
  constructor () {
    super()
    this.name = 'member:list'
    this.description = 'List Members. Requires admin role'
    this.middleware = ['auth.hasRole.admin', 'paging', 'outputFormat']
    this.exportName = 'members'
    this.inputs = {
      context: {},
      q: { formatter: q => q.split(/\s+/).filter(w => w), default: '' },
      category: {},
      expiredMembership: {},
      selection: {}
    }
  }

  async run ({ params: { limit, offset, context, q, outputType, category, expiredMembership, selection }, response }) {
    const query = {
      where: {
        ...(
          q.length > 0
            ? {
              [Op.and]: [
                ...q.map(w => ({
                  [Op.or]: [
                    ...QUERY_FIELDS.map(field => ({
                      [field]: { [api.sequelize.sequelize.options.dialect === 'postgres' ? Op.iLike : Op.like]: `%${w}%` }
                    }))
                  ]
                }))
              ]
            }
            : {}
        ),
        ...(category && { category }),
        ...(expiredMembership === '1' ? {
          membershipEndDate: {
            [Op.lte]: new Date()
          }
        } : {}),
        ...(selection ? {
          id: {
            [Op.in]: selection
          }
        } : {})
      },
      ...(limit !== -1 ? { offset, limit } : {}),
      include: ['familyMembers'],
      order: [['firstName', 'ASC'], ['lastName', 'ASC'], ['cardId', 'ASC']]
    }
    const res = await api.models.member.findAndCountAll(query)
    response.data = await Promise.all(res.rows.map(u => u.toJSON(context)))
    response.count = res.count
  }
}

class Destroy extends Action {
  constructor () {
    super()
    this.name = 'member:destroy'
    this.description = 'Delete member. Requires admin role'
    this.middleware = ['csrf', 'auth.hasRole.admin', 'member.params']
    this.inputs = { memberId: { required: true } }
  }

  async run ({ member, response }) {
    response.success = false
    await member.destroy()
    response.success = true
  }
}

class Show extends Action {
  constructor () {
    super()
    this.name = 'member:show'
    this.description = 'Retrieve information regarding specific member'
    this.middleware = ['auth.hasRole.admin', 'member.params']
    this.inputs = { memberId: { required: true }, context: {} }
  }

  async run ({ member, response, params: { context } }) {
    response.success = false
    response.data = member.toJSON(context)
    const familyMembers = await member.getFamilyMembers()
    switch (context) {
      case 'edit':
        response.data.familyMembers = familyMembers.map(m => m.id)
        break
      default:
      case 'view':
        response.data.familyMembers = familyMembers.map(m => m.toJSON())
        break
    }
    response.success = true
  }
}

class Update extends Show {
  constructor () {
    super()
    this.name = 'member:update'
    this.description = 'Update member info'
    this.middleware = ['csrf', 'auth.hasRole.admin', 'member.params']
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
      familyMembers: {},
      membershipStartDate: {},
      membershipFirstDate: {},
      context: {}
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

class Create extends Show {
  constructor () {
    super()
    this.name = 'member:create'
    this.description = 'Create member'
    this.middleware = ['csrf', 'auth.hasRole.admin']
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
      familyMembers: {},
      membershipStartDate: {},
      membershipFirstDate: {},
      context: {}
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

exports.list = List
exports.destroy = Destroy
exports.show = Show
exports.update = Update
exports.create = Create
