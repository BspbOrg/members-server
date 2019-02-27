'use strict'

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn('members', 'cardIssued', DataTypes.BOOLEAN)
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeColumn('members', 'cardIssued')
  }
}
