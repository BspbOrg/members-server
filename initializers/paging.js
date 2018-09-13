const { Initializer, api } = require('actionhero')

module.exports = class PagingInitializer extends Initializer {
  constructor () {
    super()
    this.name = 'paging'
  }

  async initialize () {
    api.actions.addMiddleware({
      name: 'paging',
      global: false,
      preProcessor: async ({ actionTemplate: { inputs }, params }) => {
        if (!inputs.limit) {
          inputs.limit = { formatter: parseInt, default: api.config.paging.pageSize }
        }
        if (!inputs.offset) {
          inputs.offset = { formatter: parseInt, default: 0 }
        }
      }
    })
  }
}
