'use strict'

module.exports = {
  up: async (queryInterface, DataTypes) => {
    return queryInterface.createTable('users', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      username: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: { msg: 'The specified username is already in use.' },
        validate: {
          len: [ 4, 20 ],
          is: /^[a-z][a-z0-9_.-]/i
        }
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: 'The specified email address is already in use.' },
        validate: { isEmail: true }
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user',
        validate: {
          isIn: [ [ 'user', 'admin' ] ]
        }
      },
      imported: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      language: {
        type: DataTypes.STRING,
        defaultValue: 'bg'
      },
      password: DataTypes.TEXT,
      passwordTime: DataTypes.DATE,
      resetToken: DataTypes.TEXT,
      resetTokenTime: DataTypes.DATE,
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
        { customIndex: true, fields: [ 'email' ] }
      ]
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('users')
  }
}
