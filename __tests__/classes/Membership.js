// eslint-disable-next-line no-unused-vars
/* global describe, test, expect, jest, beforeEach, afterEach */

const Membership = require('../../classes/Membership')
const { generatePayment } = require('../../test/generators')

const setup = (
  {
    api: {
      tasks: tasksOverride,
      ...apiOverride
    } = {},
    ...configOverride
  } = {}) => {
  const enqueueTaskMock = jest.fn()
  const config = {
    api: {
      tasks: {
        enqueue: enqueueTaskMock,
        ...tasksOverride
      },
      ...apiOverride
    },
    ...configOverride
  }
  const membership = new Membership(config)
  return { config, membership }
}

describe('Membership', () => {
  describe('calculation', () => {
    test('end date is 1 year from payment', () => {
      const { membership } = setup()
      const payment = generatePayment({ paymentDate: ('2018-09-03') })
      const { endDate } = membership.computeMembership([payment])
      expect(endDate).toBeDate('2019-09-03')
    })

    test('payment before end of membership increments from end of membership', () => {
      const { membership } = setup()
      const payment1 = generatePayment({ paymentDate: '2018-09-03' })
      const payment2 = generatePayment({ paymentDate: '2018-10-01' })
      const { endDate } = membership.computeMembership([payment1, payment2])
      expect(endDate).toBeDate('2020-09-03')
    })

    test('payment after end of membership increments from payment date', () => {
      const { membership } = setup()
      const payment1 = generatePayment({ paymentDate: '2018-09-03' })
      const payment2 = generatePayment({ paymentDate: '2019-10-01' })
      const { endDate } = membership.computeMembership([payment1, payment2])
      expect(endDate).toBeDate('2020-10-01')
    })

    test('payment before end of membership and before another payment, increments from date of first payment', () => {
      const { membership } = setup()
      const payment1 = generatePayment({ paymentDate: '2018-10-01' })
      const payment2 = generatePayment({ paymentDate: '2018-09-03' })
      const { endDate } = membership.computeMembership([payment1, payment2])
      expect(endDate).toBeDate('2020-09-03')
    })

    test('start date is date of payment', () => {
      const { membership } = setup()
      const payment = generatePayment({ paymentDate: '2018-09-03' })
      const { startDate } = membership.computeMembership([payment])
      expect(startDate).toBeDate('2018-09-03')
    })

    test('start date is date of payment of earliest payment', () => {
      const { membership } = setup()
      const payment1 = generatePayment({ paymentDate: '2018-09-04' })
      const payment2 = generatePayment({ paymentDate: '2018-09-03' })
      const payment3 = generatePayment({ paymentDate: '2018-09-05' })
      const { startDate } = membership.computeMembership([payment1, payment2, payment3])
      expect(startDate).toBeDate('2018-09-03')
    })

    test('start date is date of payment of last uninterrupted period', () => {
      const { membership } = setup()
      const payment1 = generatePayment({ paymentDate: '2016-09-04' })
      const payment2 = generatePayment({ paymentDate: '2018-09-03' })
      const payment3 = generatePayment({ paymentDate: '2018-09-05' })
      const { startDate } = membership.computeMembership([payment1, payment2, payment3])
      expect(startDate).toBeDate('2018-09-03')
    })

    test('payment at end of membership extends membership', () => {
      const { membership } = setup()
      const payment1 = generatePayment({ paymentDate: '2018-09-03' })
      const payment2 = generatePayment({ paymentDate: '2019-09-03' })
      const { startDate } = membership.computeMembership([payment1, payment2])
      expect(startDate).toBeDate('2018-09-03')
    })
  })

  describe('enqueueRecompute', () => {
    test('enqueues task', () => {
      const { membership, config: { api: { tasks: { enqueue } } } } = setup()
      membership.enqueueRecompute([1])
      expect(enqueue).toHaveBeenCalled()
    })

    test('enqueues task for each member', () => {
      const { membership, config: { api: { tasks: { enqueue } } } } = setup()
      membership.enqueueRecompute([1, 2])
      expect(enqueue).toHaveBeenCalledTimes(2)
      expect(enqueue.mock.calls[0]).toEqual(expect.arrayContaining([{ memberId: 1 }]))
      expect(enqueue.mock.calls[1]).toEqual(expect.arrayContaining([{ memberId: 2 }]))
    })
  })
})
