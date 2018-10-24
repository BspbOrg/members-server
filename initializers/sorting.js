const { Initializer, api } = require('actionhero')
const boolean = require('boolean')
const SortingProcessor = require('../classes/SortingProcessor')
const InputFormatter = require('../classes/InputFormatter')

module.exports = class SortingInitializer extends Initializer {
  constructor () {
    super()
    this.name = 'sorting'
  }

  async initialize () {
    api.actions.addMiddleware({
      name: 'sorting',
      global: false,
      preProcessor: async (data) => {
        const { actionTemplate: { inputs }, params } = data
        const sortingProcessor = new SortingProcessor()

        if (!inputs.order) {
          inputs.order = {
            formatter: p => (InputFormatter.formatStringToArray({ input: p, separator: '+' }))
          }
        }
        if (!inputs.asc) {
          inputs.asc = { formatter: (p) => boolean(p), default: true }
        }

        data.sorting = (defaultValue) => {
          return sortingProcessor.generateSortingQuery({
            columns: params.order,
            ascending: params.asc,
            defaultValue: defaultValue
          })
        }
      }
    })
  }
}
