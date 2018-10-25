exports.default = {
  expirationReminder: (api) => {
    return {
      // Frequency defines time period (in days) between two checks for expiring memberships.
      frequency: Math.round(1000 * 60 * 60 * (24 * process.env.CHECK_FOR_EXPIRING_MEMBERSHIPS_PERIOD)) || 0,
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
