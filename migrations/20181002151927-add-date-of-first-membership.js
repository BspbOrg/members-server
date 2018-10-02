'use strict'

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn('members', 'membershipFirstDate', { type: DataTypes.DATEONLY, allowNull: true })
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeColumn('members', 'membershipFirstDate')
  }
}
