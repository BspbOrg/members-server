'use strict'

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addConstraint('payments', ['billingMemberId', 'paymentDate'], {
      type: 'unique',
      name: 'compositeKeyBillingMemberPaymentDate'
    })
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeConstraint('payments', 'compositeKeyBillingMemberPaymentDate')
  }
}
