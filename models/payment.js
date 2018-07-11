const {Model, or} = require('sequelize')

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
        allowNull: false,
        unique: 'compositeKeyBillingMemberPaymentDate'
      },
      amount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: {min: 1}
      },
      membershipType: DataTypes.STRING,
      paymentType: DataTypes.STRING,
      billingMemberId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        unique: 'compositeKeyBillingMemberPaymentDate'
      }
    }, {
      sequelize,
      modelName: 'payment',
      paranoid: true
    })
  }

  static async create (values, options) {
    const model = await super.create(values, options)
    if (values.members) {
      await model.setMembers(values.members)
    }
    return model
  }

  static associate ({member, payment}) {
    payment.belongsTo(member, {as: 'billingMember'})
    payment.belongsToMany(member, {as: 'members', through: 'payment_members'})
  }

  static loadScopes ({member, payment}) {
    payment.addScope('defaultScope', {
      include: [payment.associations.members]
    }, {override: true})
    payment.addScope('member', function (memberId) {
      return {
        where: or(
          {'$members->payment_members.memberId$': memberId},
          {billingMemberId: memberId}
        ),
        include: [payment.associations.members]
      }
    })
  }

  static scopeMember (memberId) {
    return this.scope({method: ['member', memberId]})
  }

  toJSON () {
    const json = super.toJSON()
    json.members = this.members.map(m => m ? m.toJSON('short') : m)
    return json
  }
}

module.exports = Payment.init.bind(Payment)
