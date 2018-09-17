const { Initializer, api } = require('actionhero')
const IntegrationTool = require('../classes/IntegrationTool')
const config = api.config.integration

module.exports = class IntegrationInitializer extends Initializer {
  constructor () {
    super()
    this.name = 'integration'
  }

  async initialize () {
    api.integration = new IntegrationTool({ api, config })
  }
}
