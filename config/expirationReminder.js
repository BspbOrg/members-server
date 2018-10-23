exports.default = {
  expirationReminder: (api) => {
    return {
      // Frequency defines time period (in miliseconds) between two checks for expiring memberships.
      frequency: 1000 * 60 * 60 * 24,
      daysBeforeExpiration: 30,
      minDaysBeforeExpiration: 5,
      emailTemplateName: 'aboutToExpire',
      emailSubject: ''
    }
  }
}
exports.test = {
  expirationReminder: (api) => {
    return {
      frequency: 1000 * 60 * 2,
      daysBeforeExpiration: 30,
      minDaysBeforeExpiration: 5
    }
  }
}
