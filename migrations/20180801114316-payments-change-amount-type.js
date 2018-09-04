'use strict'

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.changeColumn('payments', 'amount', { type: DataTypes.DOUBLE, allowNull: false })
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.changeColumn('payments', 'amount', { type: DataTypes.INTEGER.UNSIGNED, allowNull: false })
  }
}
