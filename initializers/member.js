const { Initializer, api } = require('actionhero')

async function resolveMember (memberId, data) {
  if (data.member) return

  const { connection: { rawConnection } } = data

  if (!memberId) {
    throw new Error('Missing memberId')
  }

  data.member = await api.models.member.findOne({ where: { id: memberId } })
  if (!data.member) {
    rawConnection.responseHttpCode = 404
    throw new Error('Member not found')
  }
}

module.exports = class MemberInitializer extends Initializer {
  constructor () {
    super()
    this.name = 'member'
  }

  async initialize () {
    api.actions.addMiddleware({
      name: 'member.params',
      global: false,
      priority: 10000,
      preProcessor: async (data) => {
        const { params: { memberId } } = data
        if (!memberId) throw new Error('Missing memberId in params')
        return resolveMember(memberId, data)
      }
    })
  }
}
