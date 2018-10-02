const { Model } = require('sequelize')

class CardId extends Model {
  static init (sequelize, DataTypes) {
    return super.init({
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      }
    }, {
      sequelize,
      modelName: 'cardid',
      paranoid: true
    })
  }
}

module.exports = function (sequelize, DataTypes) {
  return CardId.init(sequelize, DataTypes)
}
