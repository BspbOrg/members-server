const { Initializer, api } = require('actionhero')

async function resolvePayment (paymentId, data) {
  if (data.payment) return

  const { connection: { rawConnection }, params: { context } } = data

  if (!paymentId) {
    throw new Error('Missing paymentId')
  }

  data.payment = await api.models.payment.scopeContext(context).findOne({ where: { id: paymentId } })
  if (!data.payment) {
    rawConnection.responseHttpCode = 404
    throw new Error('Payment not found')
  }
}

module.exports = class PaymentInitializer extends Initializer {
  constructor () {
    super()
    this.name = 'payment'
  }

  async initialize () {
    api.actions.addMiddleware({
      name: 'payment.params',
      global: false,
      priority: 10000,
      preProcessor: async (data) => {
        const { params: { paymentId } } = data
        if (!paymentId) throw new Error('Missing paymentId in params')
        return resolvePayment(paymentId, data)
      }
    })
  }
}
