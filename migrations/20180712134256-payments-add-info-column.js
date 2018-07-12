'use strict'

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn('payments', 'info', {type: DataTypes.STRING, allowNull: true})
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeColumn('payments', 'info')
  }
}
