const bcrypt = require('bcrypt')
const crypto = require('crypto')
const omit = require('lodash.omit')

module.exports = function (sequelize, DataTypes, api) {
  const config = api.config.auth

  const model = sequelize.define('user', {
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
    paranoid: true,
    indexes: [
      { unique: true, fields: [ 'email' ] },
      { unique: true, fields: [ 'username' ] }
    ]
  })

  model.associate = function (models) {
    // associations can be defined here
    // models.user.hasMany(models.usermeta)
  }

  model.hook('beforeBulkCreate', async users => Promise.all(users.map(user => user.updatePassword())))
  model.hook('beforeCreate', async user => user.updatePassword())
  model.hook('beforeUpdate', async user => user.changed('password') && user.updatePassword())

  model.prototype.name = function () {
    return [ this.firstName, this.lastName ].filter(v => v).join(' ')
  }

  model.prototype.authenticate = async function (password) {
    return bcrypt.compare(password, this.password)
  }

  model.prototype.updatePassword = async function () {
    const salt = await bcrypt.genSalt(config.bcryptComplexity)
    this.password = await bcrypt.hash(this.password, salt)
  }

  model.prototype.createResetToken = async function () {
    const buf = await crypto.randomBytes(config.resetTokenBytes)
    const pwToken = buf.toString('hex')
    const salt = await bcrypt.genSalt(config.bcryptComplexity)

    this.resetToken = await bcrypt.hash(pwToken, salt)
    this.resetTokenTime = new Date()

    return pwToken
  }

  model.prototype.checkResetToken = async function (token) {
    if (!this.resetToken || !this.resetTokenTime) return false
    if (new Date().getTime() - this.resetTokenTime.getTime() > config.resetTokenTTL) return false
    return bcrypt.compare(token, this.resetToken)
  }

  model.prototype.clearResetToken = function () {
    this.resetToken = null
    this.resetTokenTime = null
  }

  model.prototype.toJSON = function () {
    return omit(this.dataValues, config.excludedAttributes)
  }

  return model
}
