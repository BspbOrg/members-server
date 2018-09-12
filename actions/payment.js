'use strict'

const { api, Action } = require('actionhero')
const { Op } = require('sequelize')

exports.list = class List extends Action {
  constructor () {
    super()
    this.name = 'payment:list'
    this.description = 'List Payments. Requires admin role'
    this.middleware = ['auth.hasRole.admin', 'paging']
    this.inputs = {
      limit: {},
      offset: {},
      memberId: {},
      context: {},
      fromDate: {},
      toDate: {},
      membershipType: {},
      paymentType: {},
      minAmount: {},
      maxAmount: {}
    }
  }

  async run ({ params: { offset, limit, memberId, context, fromDate, toDate, membershipType, paymentType, minAmount, maxAmount }, response }) {
    const query = {
      // offset&limit doesn't work with member scope
      ...(memberId ? {} : { offset, limit }),
      where: {
        ...(fromDate || toDate ? {
          paymentDate: {
            ...(fromDate ? { [Op.gte]: fromDate } : {}),
            ...(toDate ? { [Op.lte]: toDate } : {})
          }
        } : {}),
        ...(minAmount || maxAmount ? {
          amount: {
            ...(minAmount ? { [Op.gte]: minAmount } : {}),
            ...(maxAmount ? { [Op.lte]: maxAmount } : {})
          }
        } : {}),
        ...(membershipType ? { membershipType } : {}),
        ...(paymentType ? { paymentType } : {})
      },
      order: [['paymentDate', 'DESC']]
    }
    const scoped = memberId ? api.models.payment.scopeMember(memberId) : api.models.payment
    const res = await scoped.findAndCountAll(query)
    response.data = await Promise.all(
      (
        (memberId && limit !== '-1' && limit !== -1)
          ? res.rows.slice(offset, offset + limit)
          : res.rows
      )
        .map(u => u.toJSON(context || 'view')))
    response.count = res.count
  }
}

exports.destroy = class Destroy extends Action {
  constructor () {
    super()
    this.name = 'payment:destroy'
    this.description = 'Delete payment. Requires admin role'
    this.middleware = ['auth.hasRole.admin', 'payment.params']
    this.inputs = { paymentId: { required: true } }
  }

  async run ({ payment, response }) {
    response.success = false
    await payment.destroy()
    await api.membership.enqueueRecompute(payment.members)
    response.success = true
  }
}

exports.Show = class Show extends Action {
  constructor () {
    super()
    this.name = 'payment:show'
    this.description = 'Retrieve information regarding specific payment'
    this.middleware = ['auth.hasRole.admin', 'payment.params']
    this.inputs = { paymentId: { required: true }, context: {} }
  }

  async run ({ payment, params: { context }, response }) {
    response.success = false
    response.data = await payment.toJSON(context)
    response.success = true
  }
}

exports.update = class Update extends Action {
  constructor () {
    super()
    this.name = 'payment:update'
    this.description = 'Update payment info'
    this.middleware = ['auth.hasRole.admin', 'payment.params']
    this.inputs = {
      paymentId: { required: true },
      amount: {},
      paymentDate: {},
      membershipType: {},
      paymentType: {},
      billingMemberId: {},
      members: {},
      info: {},
      context: {}
    }
  }

  async run ({ params, response, payment }) {
    let membersToRecompute = [...payment.members]
    response.success = false
    await payment.updateAttributes(params)
    if (params.members) {
      await payment.setMembers(params.members)
      await payment.reload()
      membersToRecompute = [...membersToRecompute, ...payment.members]
    }
    response.recompute = await api.membership.enqueueRecompute(membersToRecompute)
    response.data = payment.toJSON(params.context)
    response.success = true
  }
}

exports.create = class Create extends Action {
  constructor () {
    super()
    this.name = 'payment:create'
    this.description = 'Create payment'
    this.middleware = ['auth.hasRole.admin']
    this.inputs = {
      amount: { required: true },
      paymentDate: { required: true },
      membershipType: {},
      paymentType: {},
      billingMemberId: { required: true },
      members: {},
      info: {},
      context: {}
    }
  }

  async run ({ params, response }) {
    response.success = false
    const payment = await api.models.payment.create(params)
    if (params.members) {
      await payment.setMembers(params.members)
      await payment.reload()
    }
    response.data = payment.toJSON(params.context)
    await api.membership.enqueueRecompute(payment.members)
    response.success = true
  }
}
