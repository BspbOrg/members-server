exports.default = {
  expirationReminder: (api) => {
    return {
      // Frequency defines time period (in days) between two checks for expiring memberships.
      frequency: Math.round(1000 * 60 * 60 * (24 * process.env.CHECK_FOR_EXPIRING_MEMBERSHIPS_PERIOD)) || 0,
      daysBeforeExpiration: process.env.CHECK_FOR_EXPIRING_MEMBERSHIPS_DAYS_BEFORE || 30,
      minDaysBeforeExpiration: process.env.CHECK_FOR_EXPIRING_MEMBERSHIPS_MIN_DAYS_BEFORE || 5,
      emailTemplateName: 'aboutToExpire',
      emailSubject: '',

      expiredReminderFrequency: process.env.CHECK_FOR_EXPIRED_MEMBERSHIP_PERIOD || 0,
      daysAfterExpired: process.env.CHECK_FOR_EXPIRED_MEMBERSHIP_DAYS_AFTER || 5,
      minDaysAfterExpired: process.env.CHECK_FOR_EXPIRED_MEMBERSHIPS_MIN_DAYS_AFTER || 2,
      expiredMembershipEmailTemplate: 'expiredMembership',
      expiredMembershipEmailSubject: ''
    }
  }
}

exports.test = {
  expirationReminder: (api) => {
    return {
      frequency: 1000 * 60 * 2,
      daysBeforeExpiration: 30,
      minDaysBeforeExpiration: 5,
      emailTemplateName: 'aboutToExpire',
      emailSubject: 'Your membership is expiring',

      expiredReminderFrequency: 1000 * 60 * 2,
      daysAfterExpired: 5,
      minDaysAfterExpired: 2,
      expiredMembershipEmailTemplate: 'expiredMembership',
      expiredMembershipEmailSubject: 'Your membership have expired'
    }
  }
}
