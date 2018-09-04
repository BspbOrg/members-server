const { Initializer, api } = require('actionhero')
const ImportTool = require('../classes/ImportTool')

module.exports = class ImportInitializer extends Initializer {
  constructor () {
    super()
    this.name = 'import'
  }

  async initialize () {
    api.import = new ImportTool()
  }
}
