'use strict'

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.changeColumn('members', 'username', {
      type: DataTypes.STRING(50),
      allowNull: true
    })
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.changeColumn('members', 'username', {
      type: DataTypes.STRING(20),
      allowNull: true
    })
  }
}
