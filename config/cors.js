exports[ 'default' ] = {
  cors: () => {
    return {
      // Should the plugin be enabled
      enabled: false,
      // List of origins that are allowed, all the rest will get `null` as `Access-Control-Allow-Origin`
      allowedOrigins: [ 'http://localhost:5000' ]
    }
  }
}

exports.staging = {
  cors: () => {
    return {
      enabled: true,
      allowedOrigins: '*'
    }
  }
}

exports.production = {
  cors: () => {
    return {
      enabled: true
    }
  }
}
