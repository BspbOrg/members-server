const {api} = require('actionhero')
const isBefore = require('date-fns/is_before')

module.exports = async function (payment) {
  const processed = Object.assign({}, payment)
  if (!processed.members) {
    processed.members = []
  }
  const billingMember = await
    api.models.member.findById(payment.billingMemberId)
  if (!processed.members.includes(billingMember.id)) {
    processed.members.push(billingMember.id)
  }

  if (processed.membershipType === 'family') {
    const familyMembers = await
      billingMember.getFamilyMembers()
    if (familyMembers.length === 0) {
      throw new Error('cannot create family payment without family members')
    }
    familyMembers.forEach(familyMember => {
      if (isBefore(familyMember.membershipStartDate, processed.paymentDate)) {
        if (!processed.members.includes(familyMember.id)) {
          processed.members.push(familyMember.id)
        }
      }
    })
  }
  return processed
}
