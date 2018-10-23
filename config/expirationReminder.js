exports.default = {
  expirationReminder: (api) => {
    return {
      // Frequency defines time period (in miliseconds) between two checks for expiring memberships.
      frequency: process.env.CHECK_FOR_EXPIRING_MEMBERSHIPS_PERIOD || 1000 * 60 * 60 * 24,
      daysBeforeExpiration: process.env.CHECK_FOR_EXPIRING_MEMBERSHIPS_DAYS_BEFORE || 30,
      minDaysBeforeExpiration: process.env.CHECK_FOR_EXPIRING_MEMBERSHIPS_MIN_DAYS_BEFORE || 5,
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
