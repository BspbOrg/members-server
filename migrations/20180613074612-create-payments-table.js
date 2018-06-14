'use strict'

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('payments', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      paymentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      amount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      membershipType: DataTypes.STRING,
      paymentType: DataTypes.STRING,
      billingMemberId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'members',
          key: 'id'
        }
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

    await queryInterface.createTable('payment_members', {
      paymentId: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'payments',
          key: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
      },
      memberId: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'members',
          key: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payment_members')
    await queryInterface.dropTable('members')
  }
}
