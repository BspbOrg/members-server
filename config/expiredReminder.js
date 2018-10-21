exports.default = {
  expiredReminder: (api) => {
    return {
      frequency: 1000 * 60 * 2 - 1000 * 5,
      daysAfterExpiration: 5,
      emailTemplateName: 'expired',
      emailSubject: 'Your membership have expired'
    }
  }
}
