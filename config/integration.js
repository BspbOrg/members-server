const path = require('path')
const parseDbUrl = require('parse-database-url')

exports['default'] = {
  integration: () => {
    return {
      // Should the integration with bspb.org website be enabled
      enabled: process.env.BSPBORG_DATABASE_URL,
      // Mysql connection configuration
      connection: parseDbUrl(process.env.BSPBORG_DATABASE_URL || ''),
      // Borica public key path
      boricaPublicKey: path.join(__dirname, '..', 'borika-test.cer'),
      // In ms how often to check for new borica payments and import. 0 to disable
      importBoricaPaymentsFrequency: 0
    }
  }
}

exports.staging = {
  integration: () => {
    return {
      boricaPublicKey: path.join(__dirname, '..', 'borika-prod.cer'),
      // disable for now
      importBoricaPaymentsFrequency: 0
    }
  }
}

exports.production = {
  integration: () => {
    return {
      boricaPublicKey: path.join(__dirname, '..', 'borika-prod.cer'),
      // 5 mins
      importBoricaPaymentsFrequency: 5 * 60 * 1000
    }
  }
}

exports.test = {
  integration: () => {
    return {
      enabled: false,
      connection: parseDbUrl('mysql://user:secret@localhost/site'),
      boricaPublicKey: path.join(__dirname, '..', 'borika-prod.cer'),
      importBoricaPaymentsFrequency: 0
    }
  }
}
