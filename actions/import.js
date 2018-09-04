'use strict'

const {api, Action} = require('actionhero')
const processPayment = require('../classes/PaymentPreprocessor')
const processFamily = require('../classes/FamilyMembersPreprocessor')
const boolean = require('boolean')

exports.members = class Members extends Action {
  constructor () {
    super()
    this.name = 'import:member'
    this.description = 'Import members. Requires admin role'
    this.middleware = ['auth.hasRole.admin']
    this.inputs = {
      file: {},
      create: {
        formatter: (p) => boolean(p)
      },
      update: {
        formatter: (p) => boolean(p)
      },
      failOnError: {
        formatter: (p) => boolean(p)
      },
      dryRun: {
        formatter: (p) => boolean(p)
      },
      defaults: {
        formatter: (p) => JSON.parse(p)
      }
    }
  }

  async run ({params, response}) {
    const parsed = await api.import.parseCSVFile(params.file)
    response.data = await api.import.import(api.models.member, Object.assign({}, params, {data: parsed}))
  }
}

exports.payments = class Payments extends Action {
  constructor () {
    super()
    this.name = 'import:payment'
    this.description = 'Import payments. Requires admin role'
    this.middleware = ['auth.hasRole.admin']
    this.inputs = {
      file: {},
      create: {
        formatter: (p) => boolean(p)
      },
      update: {
        formatter: (p) => boolean(p)
      },
      failOnError: {
        formatter: (p) => boolean(p)
      },
      dryRun: {
        formatter: (p) => boolean(p)
      },
      defaults: {}
    }
  }

  async run ({params, response}) {
    const parsed = await api.import.parseCSVFile(params.file)
    const members = []
    response.data = await api.import.import(api.models.payment, {...params, data: parsed}, {
      preprocessor: processPayment,
      preprocessorArgs: [{members}]
    })
    await api.membership.enqueueRecompute(members)
  }
}

exports.family = class Family extends Action {
  constructor () {
    super()
    this.name = 'import:family'
    this.description = 'Import family members. Requires admin role'
    this.middleware = ['auth.hasRole.admin']
    this.inputs = {
      file: {},
      create: {
        formatter: (p) => boolean(p)
      },
      update: {
        formatter: (p) => boolean(p)
      },
      failOnError: {
        formatter: (p) => boolean(p)
      },
      dryRun: {
        formatter: (p) => boolean(p)
      },
      defaults: {}
    }
  }

  async run ({params, response}) {
    const parsed = await api.import.parseCSVFile(params.file)
    response.data = await api.import.import(api.models.member_families, Object.assign({}, params, {data: parsed}), {preprocessor: processFamily})
  }
}
