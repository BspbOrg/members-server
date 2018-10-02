const { api, Task } = require('actionhero')

module.exports = class MembershipRecompute extends Task {
  constructor () {
    super()
    this.name = 'membership:recompute'
    this.description = 'Recomputes membership start and end dates for the provided list of members'
    this.frequency = 0
    this.queue = '*'
    this.middleware = []
  }

  async run ({ memberId }) {
    const member = await api.models.member.findById(memberId)
    if (!member) throw new Error(`Member ${memberId} not found!`)
    const payments = await api.models.payment.scopeMembershipMember(memberId).findAll({})
    const { startDate: membershipStartDate, endDate: membershipEndDate, firstDate: membershipFirstDate } = api.membership.computeMembership(payments)
    await member.updateAttributes({
      membershipStartDate,
      membershipEndDate,
      // if we have membership but no cardId we should generate new one
      ...(membershipEndDate && !member.cardId ? { cardId: await api.cardId.generateId() } : {}),
      // update date of first membership if none
      ...(membershipFirstDate && !member.membershipFirstDate ? { membershipFirstDate } : {})
    })
    await api.integration.enqueueMembershipUpdate([memberId])
    return { membershipStartDate, membershipEndDate }
  }
}
