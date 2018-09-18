const { api, Task } = require('actionhero')

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
    await Promise.all(payments.map(async ({ referenceType, referenceId, username, ...paymentInfo }) => {
      const existingPayment = await api.models.payment.unscoped().findOne({
        where: { referenceId, referenceType },
        attributes: ['id']
      })
      if (existingPayment) {
        api.log(`Skipping already synced payment ${referenceType}/${referenceId} for ${username}`, 'debug')
        return
      }

      const member = await api.models.member.unscoped().findOne({
        where: { username },
        attributes: ['id']
      })
      if (!member) {
        api.log(`Failed to resolve member ${username} for payment ${referenceType}/${referenceId}`, 'warn')
        return
      }

      return api.models.payment.create({
        referenceId,
        referenceType,
        ...paymentInfo,
        billingMemberId: member.id,
        members: [member.id]
      })
    }))
    this.cursor = cursor
  }
}
