exports.default = {
  auth: (api) => {
    return {
      bcryptComplexity: 13,
      resetTokenBytes: 64,
      resetTokenTTL: 15 * 60 * 1000,
      excludedAttributes: [ 'password', 'passwordTime', 'resetToken', 'resetTokenTime' ]
    }
  }
}

exports.test = {
  auth: (api) => {
    return {
      bcryptComplexity: 1
    }
  }
}
