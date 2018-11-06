'use strict'

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn('members', 'notes', { type: DataTypes.STRING, allowNull: true })
    await queryInterface.addColumn('payments', 'notes', { type: DataTypes.STRING, allowNull: true })
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeColumn('members', 'notes')
    await queryInterface.removeColumn('payments', 'notes')
  }
}
