const {Model} = require('sequelize')
const PNF = require('google-libphonenumber').PhoneNumberFormat
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance()
const emailValidator = require('email-validator')

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
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: {msg: 'The specified username is already in use.'},
        validate: {
          len: {
            args: [4, 20],
            msg: 'Username must be between 4 and 20 characters'
          },
          is: {
            args: /^[a-z][a-z0-9_.-]/i,
            msg: 'Username must include only letters, digits, "_", ".", "-"'
          }
        }
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: {msg: 'The specified email address is already in use.'},
        validate: {
          isValidEmail (email) {
            if (!emailValidator.validate(email)) {
              throw new Error('Specified email is invalid')
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
        unique: {msg: 'The specified access ID is already in use.'}
      },
      cardId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: {msg: 'The specified card ID is already in use.'}
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
        unique: {msg: 'The specified phone number is already in use.'},
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
          isIn: [['student', 'regular', 'retired']]
        }
      },
      membershipStartDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: true
        }
      }
    }, {
      sequelize,
      modelName: 'member',
      paranoid: true,
      hooks: {}
    })
  }

  static associate ({member}) {
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
  }

  static loadScopes ({member}) {
    member.addScope('family', function (memberId) {
      return {
        where: {'$familyMasters.id$': memberId},
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
    return this.scope({method: ['family', memberId]})
  }

  get name () { return [this.firstName, this.middleName, this.lastName].filter(v => v).join(' ') }

  toJSON (context) {
    switch (context) {
      case 'short':
        return {
          id: this.id,
          firstName: this.firstName,
          lastName: this.lastName
        }
      default:
        return super.toJSON()
    }
  }
}

module.exports = function (sequelize, DataTypes) {
  return Member.init(sequelize, DataTypes)
}
