// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const { generateMember } = require('../../test/generators')

const fetchLastPayment = async ({ username }) => ah.api.integration.perform(async (conn) => conn.query(`
  SELECT member_id, h.name, payment_date, paid_date, paid 
  FROM members_history h
  JOIN members m on (h.member_id = m.id)
  WHERE m.username = ? 
  ORDER BY h.id DESC
  LIMIT 1
`, [username]))

describe('task IntegrationMembershipUpdate', () => {
  let member

  beforeAll(ah.start)
  afterAll(ah.stop)

  afterEach(async () => {
    if (member) {
      await member.destroy({ force: true })
    }
  })

  test('should create payment', async () => {
    member = await ah.api.models.member.create(generateMember({ username: 'user1', membershipEndDate: '2018-09-30' }))
    await ah.api.specHelper.runTask('IntegrationMembershipUpdate', { memberId: member.id })
    const [rows] = await fetchLastPayment(member)
    expect(rows).toMatchSnapshot()
  })
})
