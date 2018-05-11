const bcrypt = require('bcrypt')
const crypto = require('crypto')
const omit = require('lodash.omit')
const { Model } = require('sequelize')
const { api } = require('actionhero')
const config = api.config.auth
const util = require('util')

class User extends Model {
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
      resetTokenTime: DataTypes.DATE
    }, {
      sequelize,
      modelName: 'user',
      paranoid: true,
      hooks: {
        beforeBulkCreate: User.beforeBulkCreate,
        beforeCreate: User.beforeCreate,
        beforeUpdate: User.beforeUpdate
      }
    })
  }

  static associate (models) {

  }

  static async beforeBulkCreate (users) {
    return Promise.all(users.map(user => user.updatePassword()))
  }

  static async beforeCreate (user) {
    return user.updatePassword()
  }

  static async beforeUpdate (user) {
    if (!user.changed('password')) return
    return user.updatePassword()
  }

  get name () { return [ this.firstName, this.lastName ].filter(v => v).join(' ') }

  async authenticate (password) {
    const success = await bcrypt.compare(password, this.password)
    if (success) {
      this.clearResetToken()
      this.lastLoginAt = new Date()
    }
    return success
  }

  async updatePassword () {
    const salt = await bcrypt.genSalt(config.bcryptComplexity)
    this.password = await bcrypt.hash(this.password, salt)
  }

  async createResetToken () {
    const buf = await util.promisify(crypto.randomBytes)(config.resetTokenBytes)
    const pwToken = buf.toString('hex')
    const salt = await bcrypt.genSalt(config.bcryptComplexity)

    this.resetToken = await bcrypt.hash(pwToken, salt)
    this.resetTokenTime = new Date()

    return pwToken
  }

  async checkResetToken (token) {
    if (!this.resetToken || !this.resetTokenTime) return false
    if (new Date().getTime() - this.resetTokenTime.getTime() > config.resetTokenTTL) return false
    return bcrypt.compare(token, this.resetToken)
  }

  clearResetToken () {
    this.resetToken = null
    this.resetTokenTime = null
  }

  toJSON () {
    return omit(super.toJSON(), config.excludedAttributes)
  }
}

module.exports = function (sequelize, DataTypes) {
  return User.init(sequelize, DataTypes)
}
