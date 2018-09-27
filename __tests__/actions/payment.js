// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const { snapshot, testActionPermissions, testFieldChange, testPaging } = require('../../test/helpers')
const { assign } = Object
const { generatePayment, generateMember } = require('../../test/generators')
const format = require('date-fns/format')

describe('action payment', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  describe('#list', () => {
    const action = 'payment:list'

    testActionPermissions(action, {}, { guest: false, user: false, admin: true })

    test('should return list of payments', async () => {
      const payment = await ah.api.models.payment.findOne({})
      const res = await ah.runAdminAction(action)
      expect(res).toHaveProperty('data', expect.arrayContaining([
        expect.objectContaining({
          id: payment.id,
          amount: payment.amount,
          paymentDate: payment.paymentDate
        })
      ]))
    })

    testPaging(action, 'payment', () => {
      return generatePayment({ paymentType: 'TEMPORARY' })
    }, { paymentType: 'TEMPORARY' })

    test('should filter by memberId', async () => {
      const member1 = await ah.api.models.member.findOne()
      const res = await ah.runAdminAction(action, { memberId: member1.id, limit: 10 })
      expect(res).toBeSuccessAction()
      expect(res.data.length).toBeGreaterThanOrEqual(1)
      res.data.forEach(payment => {
        if (payment.billingMemberId === member1.id) {
          expect(payment.billingMemberId).toEqual(member1.id)
        } else {
          expect(payment.members).toEqual(expect.arrayContaining([expect.objectContaining({ id: member1.id })]))
        }
      })
    })

    test('should filter by billingMemberId', async () => {
      const member1 = await ah.api.models.member.findOne()
      const res = await ah.runAdminAction(action, { billingMemberId: member1.id, limit: 10 })
      expect(res).toBeSuccessAction()
      expect(res.data.length).toBeGreaterThanOrEqual(1)
      res.data.forEach(payment => {
        expect(payment.billingMemberId).toEqual(member1.id)
      })
    })

    describe('filtering', () => {
      test('should return records newer than fromDate', async () => {
        const match = await ah.api.models.payment.create(generatePayment({ paymentDate: '2017-09-16' }))
        const noMatch = await ah.api.models.payment.create(generatePayment({ paymentDate: '2017-09-14' }))
        try {
          const response = await ah.runAdminAction(action, { fromDate: '2017-09-15', limit: -1 })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: match.id })]))
          expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: noMatch.id })]))
        } finally {
          await match.destroy({ force: true })
          await noMatch.destroy({ force: true })
        }
      })

      test('should return records at fromDate', async () => {
        const match = await ah.api.models.payment.create(generatePayment({ paymentDate: '2017-09-16' }))
        const noMatch = await ah.api.models.payment.create(generatePayment({ paymentDate: '2017-09-14' }))
        try {
          const response = await ah.runAdminAction(action, { fromDate: '2017-09-16', limit: -1 })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: match.id })]))
          expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: noMatch.id })]))
        } finally {
          await match.destroy({ force: true })
          await noMatch.destroy({ force: true })
        }
      })

      test('should return records older than toDate', async () => {
        const match = await ah.api.models.payment.create(generatePayment({ paymentDate: '2017-09-16' }))
        const noMatch = await ah.api.models.payment.create(generatePayment({ paymentDate: '2017-09-18' }))
        try {
          const response = await ah.runAdminAction(action, { toDate: '2017-09-17', limit: -1 })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: match.id })]))
          expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: noMatch.id })]))
        } finally {
          await match.destroy({ force: true })
          await noMatch.destroy({ force: true })
        }
      })

      test('should return records at toDate', async () => {
        const match = await ah.api.models.payment.create(generatePayment({ paymentDate: '2017-09-16' }))
        const noMatch = await ah.api.models.payment.create(generatePayment({ paymentDate: '2017-09-18' }))
        try {
          const response = await ah.runAdminAction(action, { toDate: '2017-09-16', limit: -1 })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: match.id })]))
          expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: noMatch.id })]))
        } finally {
          await match.destroy({ force: true })
          await noMatch.destroy({ force: true })
        }
      })

      test('should return records at both fromDate and toDate', async () => {
        const match = await ah.api.models.payment.create(generatePayment({ paymentDate: '2017-09-16' }))
        const noMatch = await ah.api.models.payment.create(generatePayment({ paymentDate: '2017-09-18' }))
        const noMatch2 = await ah.api.models.payment.create(generatePayment({ paymentDate: '2017-09-14' }))
        try {
          const response = await ah.runAdminAction(action, { toDate: '2017-09-16', limit: -1 })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: match.id })]))
          expect(data).not.toEqual(expect.arrayContaining([
            expect.objectContaining({ id: noMatch.id }),
            expect.objectContaining({ id: noMatch2.id })
          ]))
        } finally {
          await match.destroy({ force: true })
          await noMatch.destroy({ force: true })
          await noMatch2.destroy({ force: true })
        }
      })

      test('should return records matching membershipType', async () => {
        const match = await ah.api.models.payment.create(generatePayment({ membershipType: 'testmem' }))
        const noMatch = await ah.api.models.payment.create(generatePayment({ membershipType: 'unmatch' }))
        try {
          const response = await ah.runAdminAction(action, { membershipType: 'testmem', limit: -1 })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: match.id })]))
          expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: noMatch.id })]))
        } finally {
          await match.destroy({ force: true })
          await noMatch.destroy({ force: true })
        }
      })

      test('should return records matching paymentType', async () => {
        const match = await ah.api.models.payment.create(generatePayment({ paymentType: 'testpay' }))
        const noMatch = await ah.api.models.payment.create(generatePayment({ paymentType: 'unmatch' }))
        try {
          const response = await ah.runAdminAction(action, { paymentType: 'testpay', limit: -1 })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: match.id })]))
          expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: noMatch.id })]))
        } finally {
          await match.destroy({ force: true })
          await noMatch.destroy({ force: true })
        }
      })

      test('should return records with amount more than minAmount', async () => {
        const match = await ah.api.models.payment.create(generatePayment({ amount: 10 }))
        const noMatch = await ah.api.models.payment.create(generatePayment({ amount: 8 }))
        try {
          const response = await ah.runAdminAction(action, { minAmount: 9, limit: -1 })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: match.id })]))
          expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: noMatch.id })]))
        } finally {
          await match.destroy({ force: true })
          await noMatch.destroy({ force: true })
        }
      })

      test('should return records with amount equal to minAmount', async () => {
        const match = await ah.api.models.payment.create(generatePayment({ amount: 10 }))
        const noMatch = await ah.api.models.payment.create(generatePayment({ amount: 8 }))
        try {
          const response = await ah.runAdminAction(action, { minAmount: 10, limit: -1 })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: match.id })]))
          expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: noMatch.id })]))
        } finally {
          await match.destroy({ force: true })
          await noMatch.destroy({ force: true })
        }
      })

      test('should return records with amount less than maxAmount', async () => {
        const match = await ah.api.models.payment.create(generatePayment({ amount: 8 }))
        const noMatch = await ah.api.models.payment.create(generatePayment({ amount: 10 }))
        try {
          const response = await ah.runAdminAction(action, { maxAmount: 9, limit: -1 })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: match.id })]))
          expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: noMatch.id })]))
        } finally {
          await match.destroy({ force: true })
          await noMatch.destroy({ force: true })
        }
      })

      test('should return records with amount equal to maxAmount', async () => {
        const match = await ah.api.models.payment.create(generatePayment({ amount: 8 }))
        const noMatch = await ah.api.models.payment.create(generatePayment({ amount: 10 }))
        try {
          const response = await ah.runAdminAction(action, { maxAmount: 8, limit: -1 })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: match.id })]))
          expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: noMatch.id })]))
        } finally {
          await match.destroy({ force: true })
          await noMatch.destroy({ force: true })
        }
      })

      test('should return records with amount equal to minAmount and maxAmount', async () => {
        const match = await ah.api.models.payment.create(generatePayment({ amount: 10 }))
        const noMatch = await ah.api.models.payment.create(generatePayment({ amount: 8 }))
        const noMatch2 = await ah.api.models.payment.create(generatePayment({ amount: 12 }))
        try {
          const response = await ah.runAdminAction(action, { minAmount: 10, maxAmount: 10, limit: -1 })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: match.id })]))
          expect(data).not.toEqual(expect.arrayContaining([
            expect.objectContaining({ id: noMatch.id }),
            expect.objectContaining({ id: noMatch2.id })
          ]))
        } finally {
          await match.destroy({ force: true })
          await noMatch.destroy({ force: true })
          await noMatch2.destroy({ force: true })
        }
      })

      test('should return records with member', async () => {
        const member1 = await ah.api.models.member.create(generateMember())
        const member2 = await ah.api.models.member.create(generateMember())
        const match = await ah.api.models.payment.create(generatePayment({ members: [member1.id] }))
        const noMatch = await ah.api.models.payment.create(generatePayment({ members: [member2.id] }))
        try {
          const response = await ah.runAdminAction(action, { memberId: member1.id, limit: -1 })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: match.id })]))
          expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: noMatch.id })]))
        } finally {
          await match.destroy({ force: true })
          await noMatch.destroy({ force: true })
          await member1.destroy({ force: true })
          await member2.destroy({ force: true })
        }
      })
    })
  })

  describe('#destroy', () => {
    let payment
    const action = 'payment:destroy'
    const params = async () => { return { paymentId: payment.id } }

    beforeEach(async () => {
      payment = await ah.api.models.payment.create(generatePayment())
    })

    afterEach(async () => {
      await ah.api.models.payment.destroy({ where: { id: payment.id }, force: true })
    })

    testActionPermissions(action, params, { guest: false, user: false, admin: true })

    test('should delete from db', async () => {
      await ah.runAdminAction(action, await params())
      const record = await ah.api.models.payment.findOne({ where: { id: payment.id } })
      expect(record).toBeFalsy()
    })
  })

  describe('#show', () => {
    const action = 'payment:show'
    const params = async () => { return { paymentId: (await ah.api.models.payment.findOne({})).id } }

    testActionPermissions(action, params, { guest: false, user: false, admin: true })

    test('should contain all initial fields', async () => {
      const rawData = generatePayment({}, { addMembers: true })
      const payment = await ah.api.models.payment.create(rawData)

      const response = await ah.runAdminAction(action, { paymentId: payment.id })

      const expected = assign({}, rawData)
      expected.paymentDate = format(expected.paymentDate, 'YYYY-MM-DD')
      expect(response).toHaveProperty('data', expect.objectContaining(expected))
    })

    test('should match snapshot', async () => {
      const payment = await ah.api.models.payment.findOne({ order: [['id', 'ASC']] })
      const response = await ah.runAdminAction(action, { paymentId: payment.id })
      snapshot(response.data)
    })
  })

  describe('#update', () => {
    let payment
    let updatedParams
    const action = 'payment:update'
    const params = async () => { return assign({ paymentId: payment.id }, updatedParams) }

    beforeEach(async () => {
      payment = await ah.api.models.payment.create(generatePayment({}, { addMembers: true }))
      updatedParams = generatePayment({}, { addMembers: true })
    })

    afterEach(async () => {
      await ah.api.models.payment.destroy({ where: { id: payment.id }, force: true })
    })

    testActionPermissions(action, params, { guest: false, user: false, admin: true })

    const fields = [
      'amount', 'paymentDate', 'membershipType', 'paymentType', 'billingMemberId', 'members', 'info'
    ]
    fields.forEach(field =>
      testFieldChange(
        // get request
        'payment:show', () => { return { paymentId: payment.id } },
        // update request
        action, params,
        // field that should change
        field)
    )
  })

  describe('#create', () => {
    const action = 'payment:create'
    const params = generatePayment({ paymentType: 'TEMPORARY' }, { addMembers: true })

    afterEach(async () => {
      ah.api.models.payment.destroy({ where: { paymentType: 'TEMPORARY' }, force: true })
    })

    testActionPermissions(action, params, { guest: false, user: false, admin: true })

    describe('when created new payment', () => {
      let response
      beforeEach(async () => {
        response = await ah.runAdminAction(action, params)
      })

      test('should assign id', async () => {
        expect(response).toHaveProperty('data.id', expect.anything())
      })

      describe('and later retrieved', async () => {
        let getResponse
        beforeEach(async () => {
          getResponse = await ah.runAdminAction('payment:show', { paymentId: response.data.id })
        })

        test('should succeed', async () => {
          expect(getResponse).toBeSuccessAction()
        })

        test('should have the provided properties', async () => {
          const expected = assign({}, params)
          expected.paymentDate = format(expected.paymentDate, 'YYYY-MM-DD')
          expect(getResponse.data).toEqual(expect.objectContaining(expected))
        })
      })
    })
  })

  describe('membership recalculation', () => {
    let enqueueSpy
    beforeEach(async () => {
      enqueueSpy = jest.spyOn(ah.api.membership, 'enqueueRecompute')
    })
    afterEach(async () => {
      enqueueSpy.mockRestore()
      ah.api.models.payment.destroy({ where: { paymentType: 'TEMPORARY' }, force: true })
    })

    test('schedule for members when payment is created', async () => {
      const action = 'payment:create'
      const params = generatePayment({ paymentType: 'TEMPORARY', billingMemberId: 1, members: [2] })
      const response = await ah.runAdminAction(action, params)
      expect(response).toBeSuccessAction()
      expect(enqueueSpy).toHaveBeenCalledWith([expect.objectContaining({ id: 2 })])
    })

    test('schedule for old members when members are modified', async () => {
      const payment = await ah.api.models.payment.create(generatePayment({ paymentType: 'TEMPORARY', members: [1] }))
      expect(payment.id).toBeTruthy()
      const action = 'payment:update'
      const params = { paymentId: payment.id, members: [2] }
      const response = await ah.runAdminAction(action, params)
      expect(response).toBeSuccessAction()
      expect(enqueueSpy).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 1 })]))
    })

    test('schedule for new members when members are modified', async () => {
      const payment = await ah.api.models.payment.create(generatePayment({ paymentType: 'TEMPORARY', members: [1] }))
      expect(payment.id).toBeTruthy()
      const action = 'payment:update'
      const params = { paymentId: payment.id, members: [2] }
      const response = await ah.runAdminAction(action, params)
      expect(response).toBeSuccessAction()
      expect(enqueueSpy).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 2 })]))
    })

    test('schedule for members when payment is destroyed', async () => {
      const payment = await ah.api.models.payment.create(generatePayment({ paymentType: 'TEMPORARY', members: [1] }))
      expect(payment.id).toBeTruthy()
      const action = 'payment:destroy'
      const params = { paymentId: payment.id }
      const response = await ah.runAdminAction(action, params)
      expect(response).toBeSuccessAction()
      expect(enqueueSpy).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 1 })]))
    })
  })
})
