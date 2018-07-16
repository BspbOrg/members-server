'use strict'

const {api, Action} = require('actionhero')
const processPayment = require('../classes/PaymentPreprocessor')

exports.members = class Members extends Action {
  constructor () {
    super()
    this.name = 'import:member'
    this.description = 'Import members. Requires admin role'
    this.middleware = ['auth.hasRole.admin']
    this.inputs = {
      file: {},
      create: {},
      update: {},
      failOnError: {},
      dryRun: {},
      defaults: {}
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
      create: {},
      update: {},
      failOnError: {},
      dryRun: {},
      defaults: {}
    }
  }

  async run ({params, response}) {
    const parsed = await api.import.parseCSVFile(params.file)
    response.data = await api.import.import(api.models.payment, Object.assign({}, params, {data: parsed}), processPayment)
  }
}
