'use strict'

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn('members', 'notes', { type: DataTypes.TEXT, allowNull: true })
    await queryInterface.addColumn('payments', 'notes', { type: DataTypes.TEXT, allowNull: true })
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeColumn('members', 'notes')
    await queryInterface.removeColumn('payments', 'notes')
  }
}
