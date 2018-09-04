'use strict'

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn('members', 'membershipStartDate', { type: DataTypes.DATEONLY, allowNull: true })
    if (queryInterface.sequelize.options.dialect !== 'sqlite') {
      await queryInterface.renameColumn('members', 'membershipExpire', 'membershipEndDate')
    } else {
      await queryInterface.addColumn('members', 'membershipEndDate', { type: DataTypes.DATEONLY, allowNull: true })
    }
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeColumn('members', 'membershipStartDate')
    if (queryInterface.sequelize.options.dialect !== 'sqlite') {
      await queryInterface.renameColumn('members', 'membershipEndDate', 'membershipExpire')
    } else {
      await queryInterface.removeColumn('members', 'membershipEndDate')
    }
  }
}
