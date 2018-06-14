const { Initializer, api } = require('actionhero')

const associate = () => {
  Object.keys(api.models).forEach(function (model) {
    if ('associate' in api.models[ model ]) {
      api.models[ model ].associate(api.models)
    }
  })
}

const loadScopes = () => {
  Object.keys(api.models).forEach(function (model) {
    if ('loadScopes' in api.models[ model ]) {
      api.models[ model ].loadScopes(api.models)
    }
  })
}

module.exports =
  class SequelizeFixesInitializer extends Initializer {
    constructor () {
      super()
      this.name = 'sequelize-fixes'
      this.loadPriority = 102
    }

    async initialize () {
      api.sequelize.connect = (function (superConnect) {
        return function () {
          superConnect.apply(this, arguments)
          associate()
          loadScopes()
        }
      })(api.sequelize.connect)
    }
  }
