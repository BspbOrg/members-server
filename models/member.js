const { Model } = require('sequelize')
const PNF = require('google-libphonenumber').PhoneNumberFormat
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance()
const emailValidator = require('email-validator')
const formatDate = require('date-fns/format')
const bgLocale = require('date-fns/locale/bg')

class Member extends Model {
  static init (sequelize, DataTypes) {
    return super.init({
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: { msg: 'Username is already in use.' },
        validate: {
          len: {
            args: [0, 50],
            msg: 'Username must be less than 50 characters.'
          }
        }
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: { msg: 'Email address is already in use.' },
        validate: {
          isValidEmail (email) {
            if (!emailValidator.validate(email)) {
              throw new Error('Email is invalid.')
            }
          }
        }
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
      membershipEndDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: true
        }
      },
      originalSource: {
        type: DataTypes.STRING,
        allowNull: true
      },
      accessId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: { msg: 'Access ID is already in use.' }
      },
      cardId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: { msg: 'Card ID is already in use.' }
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
        allowNull: true,
        unique: { msg: 'Phone number is already in use.' },
        set (phone) {
          if (phone) {
            phone = phone.replace(/[^\d+]/g, '')
            if (phone.includes('+')) {
              phone = phone.substring(0, 1) + phone.substring(1).replace(/\+/g, '')
            }
            try {
              let parsed
              if (phone.startsWith('0')) {
                parsed = phoneUtil.parseAndKeepRawInput(phone, 'BG')
              } else {
                parsed = phoneUtil.parseAndKeepRawInput(phone)
              }
              this.setDataValue('phone', phoneUtil.format(parsed, PNF.E164))
            } catch (error) {
              this.setDataValue('phone', phone)
            }
          }
        },
        validate: {
          isValidPhoneNumber (phone) {
            try {
              const parsed = phoneUtil.parse(phone)
              if (!phoneUtil.isValidNumber(parsed)) {
                throw new Error('Phone number is invalid.')
              }
            } catch (err) {
              throw new Error('Phone number is invalid.')
            }
          }
        }
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'regular',
        validate: {
          isIn: {
            args: [['student', 'regular', 'retired']],
            msg: `Category must be one of 'student', 'regular', 'retired'.`
          }
        }
      },
      membershipStartDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: true
        }
      },
      membershipFirstDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: true
        }
      },
      notifiedForExpiringDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: true
        }
      },
      notifiedForExpiredDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: true
        }
      }
    }, {
      sequelize,
      modelName: 'member',
      hooks: {}
    })
  }

  static associate ({ member, payment }) {
    member.belongsToMany(member, {
      as: 'familyMembers',
      through: 'member_families'
    })
    member.belongsToMany(member, {
      as: 'familyMasters',
      through: 'member_families',
      foreignKey: 'familyMemberId',
      otherKey: 'memberId'
    })
    member.belongsToMany(payment, { as: 'payments', through: 'payment_members' })
  }

  static loadScopes ({ member }) {
    member.addScope('family', function (memberId) {
      return {
        where: { '$familyMasters.id$': memberId },
        include: [{
          association: member.associations.familyMasters,
          attributes: ['id'],
          through: {
            attributes: ['memberId']
          }
        }]
      }
    })
  }

  static scopeFamily (memberId) {
    return this.scope({ method: ['family', memberId] })
  }

  get name () { return [this.firstName, this.middleName, this.lastName].filter(v => v).join(' ') }

  toJSON (context) {
    switch (context) {
      case 'edit':
        return {
          ...super.toJSON(),
          familyMembers: this.familyMembers ? this.familyMembers.map(m => m.id) : []
        }
      case 'short':
        return {
          id: this.id,
          label: [this.firstName, this.lastName].filter(v => v).join(' ') + (this.cardId ? ` (${this.cardId})` : ''),
          firstName: this.firstName,
          lastName: this.lastName,
          cardId: this.cardId
        }
      case 'card-print':
        return {
          Number: `${this.cardId}`,
          FirstName: this.firstName,
          LastName: this.lastName,
          Name: `${this.firstName} ${this.lastName}`,
          Valid: `Валидна до: ${formatDate(this.membershipEndDate, 'D MMMM YYYY', { locale: bgLocale })}`
        }
      default:
        return super.toJSON()
    }
  }
}

module.exports = function (sequelize, DataTypes) {
  return Member.init(sequelize, DataTypes)
}
