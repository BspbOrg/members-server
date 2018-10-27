'use strict'

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn('members', 'notifiedForExpiredDate', DataTypes.DATEONLY)
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeColumn('members', 'notifiedForExpiredDate')
  }
}
