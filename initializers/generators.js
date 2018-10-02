const { Initializer, api } = require('actionhero')
const SequenceGenerator = require('../classes/SequenceGenerator')

module.exports = class GeneratorsInitializer extends Initializer {
  constructor () {
    super()
    this.name = 'generators'
  }

  async start () {
    api.cardId = new SequenceGenerator({
      model: api.models.cardid
    })
  }
}
