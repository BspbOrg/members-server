const { Model } = require('sequelize')

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
        unique: { msg: 'The specified username is already in use.' },
        validate: {
          len: [ 4, 20 ],
          is: /^[a-z][a-z0-9_.-]/i
        }
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: { msg: 'The specified email address is already in use.' },
        validate: { isEmail: true }
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
        allowNull: true,
        unique: { msg: 'The specified access ID is already in use.' }
      },
      cardId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: { msg: 'The specified card ID is already in use.' }
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
        unique: { msg: 'The specified phone number is already in use.' }
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'regular',
        validate: {
          isIn: [ [ 'student', 'regular', 'retired' ] ]
        }
      }
    }, {
      sequelize,
      modelName: 'member',
      paranoid: true,
      hooks: {}
    })
  }

  static associate (models) {

  }

  get name () { return [ this.firstName, this.middleName, this.lastName ].filter(v => v).join(' ') }

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
