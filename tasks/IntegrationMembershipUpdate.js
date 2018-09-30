const subYears = require('date-fns/sub_years')
const { api, Task } = require('actionhero')

module.exports = class IntegrationMembershipUpdate extends Task {
  constructor () {
    super()
    this.name = 'IntegrationMembershipUpdate'
    this.description = 'Updates membership expiration to bspb.org'
    this.frequency = 0
    this.queue = '*'
    this.middleware = []

    this.cursor = null
  }

  async run ({ memberId }) {
    const member = await api.models.member.findById(memberId)
    if (!member) throw new Error(`Member ${memberId} not found!`)

    await api.integration.createOrUpdateMembershipPayment({
      username: member.username,
      paymentDate: subYears(member.membershipEndDate, 1)
    })
  }
}
