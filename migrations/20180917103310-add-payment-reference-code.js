'use strict'

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn('payments', 'referenceType', { type: DataTypes.STRING, allowNull: true })
    await queryInterface.addColumn('payments', 'referenceId', { type: DataTypes.STRING, allowNull: true })
    await queryInterface.addConstraint('payments', ['referenceType', 'referenceId'], {
      type: 'unique',
      name: 'compositeKeyReferenceCode'
    })
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeConstraint('payments', 'compositeKeyReferenceCode')
    await queryInterface.removeColumn('payments', 'referenceType')
    await queryInterface.removeColumn('payments', 'referenceId')
  }
}
