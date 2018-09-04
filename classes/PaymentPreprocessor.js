const { api } = require('actionhero')
const isBefore = require('date-fns/is_before')
const isSameDay = require('date-fns/is_same_day')
const boolean = require('boolean')

module.exports = async function (payment, { members = [] } = {}) {
  const processed = Object.assign({}, payment)
  if (!processed.members) {
    processed.members = []
  }
  if (!processed.members.includes(payment.billingMemberId)) {
    processed.members.push(payment.billingMemberId)
  }

  if (boolean(processed.isFamilyPayment)) {
    const billingMember = await api.models.member.findById(payment.billingMemberId)
    const familyMembers = await billingMember.getFamilyMembers()
    if (familyMembers.length === 0) {
      throw new Error('cannot create family payment without family members')
    }
    familyMembers.forEach(familyMember => {
      if (isBefore(familyMember.membershipStartDate, processed.paymentDate) || isSameDay(familyMember.membershipStartDate, processed.paymentDate)) {
        if (!processed.members.includes(familyMember.id)) {
          processed.members.push(familyMember.id)
        }
      }
    })
  }

  // add members to the global list of members that needs recompute of membership
  processed.members.forEach(memberId => members.includes(memberId) || members.push(memberId))

  return processed
}
