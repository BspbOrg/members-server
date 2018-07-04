'use strict'

const {api, Action} = require('actionhero')

exports.members = class Members extends Action {
  constructor () {
    super()
    this.name = 'import:member'
    this.description = 'Import members. Requires admin role'
    // this.middleware = ['auth.hasRole.admin']
    this.inputs = {
      importFile: {},
      createNew: {},
      updateExisting: {},
      failOnError: {},
      dryRun: {},
      defaultValues: {}
    }
  }

  async run ({params, response}) {
    const parsed = await api.import.parseCSVFile(params.importFile)
    response.data = await api.import.import(api.models.member, Object.assign({}, params, {data: parsed}))
  }
}
