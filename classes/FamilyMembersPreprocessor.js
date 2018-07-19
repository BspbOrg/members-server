const {api} = require('actionhero')

module.exports = async function (familyRelation) {
  if (familyRelation.cardId === familyRelation.familyCardId) {
    throw new Error('Master and family card Ids are the same')
  }

  const member = await api.models.member.findOne({where: {cardId: familyRelation.cardId}})
  if (!member) {
    throw new Error(`no master member found: ${familyRelation.familyCardId}`)
  }

  const familyMember = await api.models.member.findOne({where: {cardId: familyRelation.familyCardId}})
  if (!familyMember) {
    throw new Error(`no family member found: ${familyRelation.familyCardId}`)
  }

  const processed = {
    memberId: member.id,
    familyMemberId: familyMember.id
  }

  return processed
}
