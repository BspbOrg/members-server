exports[ 'default' ] = {
  cors: () => {
    return {
      // Should the plugin be enabled
      enabled: true,
      // List of origins that are allowed, all the rest will get `null` as `Access-Control-Allow-Origin`
      allowedOrigins: '*'
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
      enabled: true,
      allowedOrigins: 'https://members.bspb.org'
    }
  }
}

exports.test = {
  cors: () => {
    return {
      enabled: false
    }
  }
}
