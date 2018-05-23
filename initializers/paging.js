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
        if (inputs.limit) {
          if (!params.limit) {
            params.limit = api.config.paging.pageSize
          }
        }
        if (inputs.offset) {
          if (!params.offset) {
            params.offset = 0
          }
        }
      }
    })
  }
}
