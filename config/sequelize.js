const parseDbUrl = require('parse-database-url')

function parseDatabaseUrl (databaseUrl, options) {
  options = options || {}
  if (!databaseUrl) return options

  const dbConfig = parseDbUrl(databaseUrl)
  dbConfig.dialect = dbConfig.driver
  delete dbConfig.driver
  dbConfig.username = dbConfig.user
  delete dbConfig.user

  return Object.assign({}, options, dbConfig)
}

exports.default = {
  sequelize: (api) => {
    return parseDatabaseUrl(process.env.DATABASE_URL || 'postgres://user:secret@localhost:5432/members', {
      autoMigrate: true,
      loadFixtures: false
    })
  }
}

exports.test = {
  sequelize: function (api) {
    var config = {
      autoMigrate: true,
      loadFixtures: true,
      database: undefined,
      dialect: 'sqlite',
      storage: ':memory:',
      host: 'localhost',
      port: undefined,
      username: null,
      password: null
    }
    if (!process.env.LOG_DB) { config.logging = null }
    return config
  }
}

const merge = (overlayFn) => {
  let mergeObj = Object.assign({}, exports.default.sequelize())
  if (typeof (overlayFn) !== 'undefined') {
    mergeObj = Object.assign(mergeObj, overlayFn.sequelize())
    // Map over AH's sequelize fn
    mergeObj.sequelize = overlayFn.sequelize
  }
  return mergeObj
}

// For sequelize-cli
// Add to the exports below, if you have setup additional environment-specific settings

exports.development = exports.default.sequelize()
exports.staging = merge(exports.staging)
exports.test = merge(exports.test)
// exports.production = merge(exports.production);
