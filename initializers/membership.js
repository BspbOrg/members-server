const {Initializer, api} = require('actionhero')
const Membership = require('../classes/Membership')

module.exports = class MembershipInitializer extends Initializer {
  constructor () {
    super()
    this.name = 'membership'
  }

  async initialize () {
    api.membership = new Membership({api})
  }
}
