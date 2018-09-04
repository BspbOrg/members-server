'use strict'

const {api, Action} = require('actionhero')

exports.list = class List extends Action {
  constructor () {
    super()
    this.name = 'payment:list'
    this.description = 'List Payments. Requires admin role'
    this.middleware = ['auth.hasRole.admin', 'paging']
    this.inputs = {
      limit: {},
      offset: {}
    }
  }

  async run ({params, response}) {
    const res = await api.models.payment.findAndCountAll({
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
    this.name = 'payment:destroy'
    this.description = 'Delete payment. Requires admin role'
    this.middleware = ['auth.hasRole.admin', 'payment.params']
    this.inputs = {paymentId: {required: true}}
  }

  async run ({payment, response}) {
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
    this.inputs = {paymentId: {required: true}}
  }

  async run ({payment, response}) {
    response.success = false
    response.data = await payment.toJSON()
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
      paymentId: {required: true},
      amount: {},
      paymentDate: {},
      membershipType: {},
      paymentType: {},
      billingMemberId: {},
      members: {},
      info: {}
    }
  }

  async run ({params, response, payment}) {
    let membersToRecompute = [...payment.members]
    response.success = false
    await payment.updateAttributes(params)
    if (params.members) {
      await payment.setMembers(params.members)
      await payment.reload()
      membersToRecompute = [...membersToRecompute, ...payment.members]
    }
    api.membership.enqueueRecompute(membersToRecompute)
    response.data = payment.toJSON()
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
      amount: {required: true},
      paymentDate: {required: true},
      membershipType: {},
      paymentType: {},
      billingMemberId: {required: true},
      members: {},
      info: {}
    }
  }

  async run ({params, response}) {
    response.success = false
    const payment = await api.models.payment.create(params)
    if (params.members) {
      await payment.setMembers(params.members)
      await payment.reload()
    }
    response.data = payment.toJSON()
    await api.membership.enqueueRecompute(payment.members)
    response.success = true
  }
}
