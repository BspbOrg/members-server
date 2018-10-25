// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')

describe('initializer expirationReminder', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  test('expirationReminder to be defined', async () => {
    expect(await ah.api.expirationReminder).toBeTruthy()
  })

  test('expiredReminder to be defined', async () => {
    expect(await ah.api.expiredReminder).toBeTruthy()
  })

  test('expirationReminder have been intialized with correct configuration', async () => {
    const loadedConfig = ah.api.expirationReminder.config

    expect(loadedConfig.minDays).toEqual(ah.api.config.expirationReminder.minDaysBeforeExpiration)
    expect(loadedConfig.days).toEqual(ah.api.config.expirationReminder.daysBeforeExpiration)
    expect(loadedConfig.emailTemplateName).toEqual(ah.api.config.expirationReminder.emailTemplateName)
    expect(loadedConfig.emailSubject).toEqual(ah.api.config.expirationReminder.emailSubject)
  })

  test('expiredReminder have been initialized with correct config', async () => {
    const loadedConfig = ah.api.expiredReminder.config

    expect(loadedConfig.minDays).toEqual(ah.api.config.expirationReminder.minDaysAfterExpired)
    expect(loadedConfig.days).toEqual(ah.api.config.expirationReminder.daysAfterExpired)
    expect(loadedConfig.emailTemplateName).toEqual(ah.api.config.expirationReminder.expiredMembershipEmailTemplate)
    expect(loadedConfig.emailSubject).toEqual(ah.api.config.expirationReminder.expiredMembershipEmailSubject)
  })
})
