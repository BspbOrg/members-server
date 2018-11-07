exports.default = {
  membership: {
    expiringReminder: {
      // Time period (in days) between two checks for expiring memberships.
      frequency: (parseFloat(process.env.EXPIRING_REMINDER_FREQUENCY) || 0 /* days */) * 1000 * 60 * 60 * 24,
      // If membership expires in less than this number of days it will consider sending reminder
      maxDays: parseFloat(process.env.EXPIRING_REMINDER_MAX_DAYS) || 30,
      // If membership expires in less than this number of days it will NOT send reminder
      minDays: parseFloat(process.env.EXPIRING_REMINDER_MIN_DAYS) || 5,
      // Email template to use
      templateName: process.env.EXPIRING_REMINDER_TEMPLATE || 'membership/expiringReminder',
      // Email subject
      emailSubject: process.env.EXPIRING_REMINDER_SUBJECT || 'Изтичащо членство',
      // Email from
      emailFrom: process.env.EXPIRING_REMINDER_FROM || 'no-reply@bspb.org'
    },
    expiredNotice: {
      // Time period (in days) between two checks for expired memberships.
      frequency: (parseFloat(process.env.EXPIRED_NOTICE_FREQUENCY) || 0 /* days */) * 1000 * 60 * 60 * 24,
      // If membership expired in more than this number of days it will NOT send notice
      maxDays: parseFloat(process.env.EXPIRED_NOTICE_MAX_DAYS) || 90,
      // If membership expired in less than this number of days it will NOT send reminder
      minDays: parseFloat(process.env.EXPIRED_NOTICE_MIN_DAYS) || 0,
      // Email template to use
      templateName: process.env.EXPIRED_NOTICE_TEMPLATE || 'membership/expiredNotification',
      // Email subject
      emailSubject: process.env.EXPIRED_NOTICE_SUBJECT || 'Изтекло членство',
      // Email from
      emailFrom: process.env.EXPIRED_NOTICE_FROM || 'no-reply@bspb.org'
    }
  }
}
