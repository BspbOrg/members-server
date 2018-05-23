'use strict'

module.exports = {
  up: async (queryInterface, DataTypes) => {
    return queryInterface.createTable('members', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      username: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      middleName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      membershipExpire: {
        type: DataTypes.DATE,
        allowNull: true
      },
      originalSource: {
        type: DataTypes.STRING,
        allowNull: true
      },
      accessId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      cardId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      country: {
        type: DataTypes.STRING,
        allowNull: true
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true
      },
      postalCode: {
        type: DataTypes.STRING,
        allowNull: true
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'regular'
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
    }, {
      uniqueKeys: [
        { customIndex: true, fields: [ 'username' ] },
        { customIndex: true, fields: [ 'email' ] },
        { customIndex: true, fields: [ 'accessId' ] },
        { customIndex: true, fields: [ 'cardId' ] },
        { customIndex: true, fields: [ 'phone' ] }
      ]
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('members')
  }
}
