const { api, Task } = require('actionhero')
const { Op } = require('sequelize')

module.exports = class ImportBoricaPayments extends Task {
  constructor () {
    super()
    this.name = 'ImportBoricaPayments'
    this.description = 'Imports borica payments from bspb.org'
    this.frequency = api.config.integration.enabled ? api.config.integration.importBoricaPaymentsFrequency : 0
    this.queue = '*'
    this.middleware = []

    this.cursor = null
  }

  async run () {
    const { cursor, payments } = await api.integration.getPaymentsForSync({ cursor: this.cursor })
    const updatedMembers = await Promise.all(payments.map(async ({ referenceType, referenceId, username, membershipType, paymentDate, ...paymentInfo }) => {
      const member = await api.models.member.unscoped().findOne({
        where: { username },
        attributes: ['id']
      })
      if (!member) {
        api.log(`Failed to resolve member ${username} for payment ${referenceType}/${referenceId}`, 'warn')
        return
      }

      const billingMemberId = member.id

      const existingPayment = await api.models.payment.unscoped().findOne({
        where: {
          [Op.or]: [
            { referenceId, referenceType },
            { billingMemberId, paymentDate }
          ]
        },
        attributes: ['id']
      })

      if (existingPayment) {
        api.log(`Skipping already synced payment ${referenceType}/${referenceId} for ${username} at ${paymentDate}`, 'debug')
        return
      }

      let members = [billingMemberId]
      if (membershipType === 'family') {
        members = [...members, ...(await member.getFamilyMembers()).map(m => m.id)]
      }

      try {
        await api.models.payment.create({
          referenceId,
          referenceType,
          ...paymentInfo,
          membershipType,
          paymentDate,
          billingMemberId,
          members
        })

        return members
      } catch (e) {
        api.log(`Failed to create payment ${referenceType}/${referenceId} for ${username} at ${paymentDate}`, 'error', e)
      }
    }))
    // remove empty and get only unique ids
    await api.membership.enqueueRecompute([...new Set(updatedMembers.filter(m => m).reduce((agg, m) => ([...agg, ...m]), []))])
    this.cursor = cursor
  }
}
