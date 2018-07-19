const {api} = require('actionhero')

module.exports = async function (familyRelation, {transaction} = {transaction: null}) {
  const member = await api.models.member.findOne({where: {cardId: familyRelation.cardId}, transaction: transaction})
  const familyMember = await api.models.member.findOne({
    where: {cardId: familyRelation.familyCardId},
    transaction: transaction
  })
  if (!member) {
    throw new Error('no master member found')
  }
  if (!familyMember) {
    throw new Error('no family member found')
  }

  const processed = {
    memberId: member.id,
    familyMemberId: familyMember.id
  }

  return processed
}
