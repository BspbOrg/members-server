'use strict'

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('cardids', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      // system columns
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      deletedAt: DataTypes.DATE
    })
    if (queryInterface.sequelize.options.dialect === 'postgres') {
      queryInterface.sequelize.query('ALTER SEQUENCE cardids_id_seq RESTART 1871')
    }
  },

  down: async (queryInterface, DataTypes) => {
    return queryInterface.dropTable('cardids')
  }
}
