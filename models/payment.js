const { Model, or } = require('sequelize')

class Payment extends Model {
  static init (sequelize, DataTypes) {
    return super.init({
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
        allowNull: false,
        validate: { min: 1 }
      },
      membershipType: DataTypes.STRING,
      paymentType: DataTypes.STRING,
      billingMemberId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      }
    }, {
      sequelize,
      modelName: 'payment',
      paranoid: true
    })
  }

  static associate ({ member, payment }) {
    payment.belongsTo(member, { as: 'billingMember' })
    payment.belongsToMany(member, { as: 'members', through: 'payment_members' })
  }

  static loadScopes ({ member, payment }) {
    payment.addScope('member', function (memberId) {
      return {
        where: or(
          { '$members->payment_members.memberId$': memberId },
          { billingMemberId: memberId }
        ),
        include: [ payment.associations.members ]
      }
    })
  }
}

module.exports = Payment.init.bind(Payment)
