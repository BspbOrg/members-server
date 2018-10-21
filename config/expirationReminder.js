exports.default = {
  expirationReminder: (api) => {
    return {
      frequency: 1000 * 60 * 2 - 1000 * 5,
      daysBeforeExpiration: 30,
      emailTemplateName: 'aboutToExpire',
      emailSubject: ''
    }
  }
}
