const { Model, or } = require('sequelize')
const isFuture = require('date-fns/is_future')

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
        validate: {
          isDate: true,
          isAfter: '1999-12-31',
          isBeforeToday (value) {
            if (isFuture(value)) {
              throw new Error('Payment date cannot be in the future.')
            }
          }
        },
        unique: 'compositeKeyBillingMemberPaymentDate'
      },
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: { min: 1 }
      },
      membershipType: DataTypes.STRING,
      paymentType: DataTypes.STRING,
      billingMemberId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        unique: 'compositeKeyBillingMemberPaymentDate'
      },
      info: DataTypes.STRING,
      referenceType: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: 'compositeKeyReferenceCode'
      },
      referenceId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: 'compositeKeyReferenceCode'
      },
      notes: {
        type: DataTypes.STRING,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'payment'
    })
  }

  static async create (values, options) {
    const model = await super.create(values, options)
    if (values.members) {
      await model.setMembers(values.members, options)
    }
    return model
  }

  static associate ({ member, payment }) {
    payment.belongsTo(member, { as: 'billingMember' })
    payment.belongsToMany(member, { as: 'members', through: 'payment_members' })
  }

  static loadScopes ({ member, payment }) {
    payment.addScope('defaultScope', {
      include: [payment.associations.members]
    }, { override: true })
    payment.addScope('member', function (memberId) {
      return {
        where: or(
          { '$members->payment_members.memberId$': memberId },
          { billingMemberId: memberId }
        ),
        include: [payment.associations.members]
      }
    })
    payment.addScope('membershipMember', function (memberId) {
      return {
        where: {
          '$members->payment_members.memberId$': memberId
        },
        include: [payment.associations.members]
      }
    })
    payment.addScope('view', {
      include: [payment.associations.billingMember, payment.associations.members]
    })
    payment.addScope('edit', { include: [payment.associations.members] })
  }

  static scopeMember (memberId) {
    return this.scope({ method: ['member', memberId] })
  }

  static scopeMembershipMember (memberId) {
    return this.scope({ method: ['membershipMember', memberId] })
  }

  static scopeContext (context) {
    switch (context) {
      case 'view':
      case 'export':
        return this.scope('view')
      case 'edit':
        return this.scope('edit')
      default:
        return this
    }
  }

  toJSON (context) {
    switch (context) {
      case 'view':
      case 'export':
        return {
          ...super.toJSON(),
          members: this.members.map(m => m ? m.toJSON('short') : m),
          billingMember: this.billingMember ? this.billingMember.toJSON('short') : null
        }
      case 'edit':
      default:
        return {
          ...super.toJSON(),
          members: this.members.map(m => m ? m.id : m)
        }
    }
  }
}

module.exports = Payment.init.bind(Payment)
