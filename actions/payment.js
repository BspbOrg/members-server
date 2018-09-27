'use strict'

const { api, Action } = require('actionhero')
const { Op } = require('sequelize')

exports.list = class List extends Action {
  constructor () {
    super()
    this.name = 'payment:list'
    this.description = 'List Payments. Requires admin role'
    this.middleware = ['auth.hasRole.admin', 'paging', 'outputFormat']
    this.exportName = 'payments'
    this.inputs = {
      memberId: { formatter: parseInt },
      context: { default: 'view' },
      fromDate: {},
      toDate: {},
      membershipType: {},
      paymentType: {},
      minAmount: { formatter: parseFloat },
      maxAmount: { formatter: parseFloat },
      billingMemberId: { formatter: parseInt }
    }
  }

  async run ({ params: { offset, limit, memberId, context, fromDate, toDate, membershipType, paymentType, minAmount, maxAmount, billingMemberId }, response }) {
    const query = {
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
        ...(paymentType ? { paymentType } : {}),
        ...(billingMemberId ? { billingMemberId } : {}),
        ...(memberId ? {
          [Op.or]: [
            { '$members->payment_members.memberId$': memberId },
            { billingMemberId: memberId }
          ]
        } : {})
      },
      order: [['paymentDate', 'DESC']],
      ...(limit !== -1 && !memberId ? { offset, limit } : {})
    }
    const res = await api.models.payment.scopeContext(context).findAndCountAll(query)
    if (limit !== -1 && memberId) {
      res.rows = res.rows.slice(offset, offset + limit)
    }
    response.data = await Promise.all(res.rows.map(u => u.toJSON(context)))
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
