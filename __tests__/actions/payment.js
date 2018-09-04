// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const {snapshot, testActionPermissions, testFieldChange, testPaging} = require('../../test/helpers')
const {assign} = Object
const {generatePayment} = require('../../test/generators')
const format = require('date-fns/format')

describe('action payment', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  describe('#list', () => {
    const action = 'payment:list'

    testActionPermissions(action, {}, {guest: false, user: false, admin: true})

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
      return generatePayment({paymentType: 'TEMPORARY'})
    }, {paymentType: 'TEMPORARY'})
  })

  describe('#destroy', () => {
    let payment
    const action = 'payment:destroy'
    const params = async () => { return {paymentId: payment.id} }

    beforeEach(async () => {
      payment = await ah.api.models.payment.create(generatePayment())
    })

    afterEach(async () => {
      await ah.api.models.payment.destroy({where: {id: payment.id}, force: true})
    })

    testActionPermissions(action, params, {guest: false, user: false, admin: true})

    test('should delete from db', async () => {
      await ah.runAdminAction(action, await params())
      const record = await ah.api.models.payment.findOne({where: {id: payment.id}})
      expect(record).toBeFalsy()
    })
  })

  describe('#show', () => {
    const action = 'payment:show'
    const params = async () => { return {paymentId: (await ah.api.models.payment.findOne({})).id} }

    testActionPermissions(action, params, {guest: false, user: false, admin: true})

    test('should contain all initial fields', async () => {
      const rawData = generatePayment({}, {addMembers: true})
      const payment = await ah.api.models.payment.create(rawData)

      const response = await ah.runAdminAction(action, {paymentId: payment.id})

      const expected = assign({}, rawData)
      expected.paymentDate = format(expected.paymentDate, 'YYYY-MM-DD')
      expected.members = expected.members.map(m => expect.objectContaining({id: m}))
      expect(response).toHaveProperty('data', expect.objectContaining(expected))
    })

    test('should match snapshot', async () => {
      const payment = await ah.api.models.payment.findOne({order: [['id', 'ASC']]})
      const response = await ah.runAdminAction(action, {paymentId: payment.id})
      snapshot(response.data)
    })
  })

  describe('#update', () => {
    let payment
    let updatedParams
    const action = 'payment:update'
    const params = async () => { return assign({paymentId: payment.id}, updatedParams) }

    beforeEach(async () => {
      payment = await ah.api.models.payment.create(generatePayment({}, {addMembers: true}))
      updatedParams = generatePayment({}, {addMembers: true})
    })

    afterEach(async () => {
      await ah.api.models.payment.destroy({where: {id: payment.id}, force: true})
    })

    testActionPermissions(action, params, {guest: false, user: false, admin: true})

    const fields = [
      'amount', 'paymentDate', 'membershipType', 'paymentType', 'billingMemberId', 'members', 'info'
    ]
    fields.forEach(field =>
      testFieldChange(
        // get request
        'payment:show', () => { return {paymentId: payment.id} },
        // update request
        action, params,
        // field that should change
        field)
    )
  })

  describe('#create', () => {
    const action = 'payment:create'
    const params = generatePayment({paymentType: 'TEMPORARY'}, {addMembers: true})

    afterEach(async () => {
      ah.api.models.payment.destroy({where: {paymentType: 'TEMPORARY'}, force: true})
    })

    testActionPermissions(action, params, {guest: false, user: false, admin: true})

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
          getResponse = await ah.runAdminAction('payment:show', {paymentId: response.data.id})
        })

        test('should succeed', async () => {
          expect(getResponse).toBeSuccessAction()
        })

        test('should have the provided properties', async () => {
          const expected = assign({}, params)
          expected.paymentDate = format(expected.paymentDate, 'YYYY-MM-DD')
          expected.members = expected.members.map(m => expect.objectContaining({id: m}))
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
      ah.api.models.payment.destroy({where: {paymentType: 'TEMPORARY'}, force: true})
    })

    test('schedule for members when payment is created', async () => {
      const action = 'payment:create'
      const params = generatePayment({paymentType: 'TEMPORARY', billingMemberId: 1, members: [2]})
      const response = await ah.runAdminAction(action, params)
      expect(response).toBeSuccessAction()
      expect(enqueueSpy).toHaveBeenCalledWith([expect.objectContaining({id: 2})])
    })

    test('schedule for old members when members are modified', async () => {
      const payment = await ah.api.models.payment.create(generatePayment({paymentType: 'TEMPORARY', members: [1]}))
      expect(payment.id).toBeTruthy()
      const action = 'payment:update'
      const params = {paymentId: payment.id, members: [2]}
      const response = await ah.runAdminAction(action, params)
      expect(response).toBeSuccessAction()
      expect(enqueueSpy).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({id: 1})]))
    })

    test('schedule for new members when members are modified', async () => {
      const payment = await ah.api.models.payment.create(generatePayment({paymentType: 'TEMPORARY', members: [1]}))
      expect(payment.id).toBeTruthy()
      const action = 'payment:update'
      const params = {paymentId: payment.id, members: [2]}
      const response = await ah.runAdminAction(action, params)
      expect(response).toBeSuccessAction()
      expect(enqueueSpy).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({id: 2})]))
    })

    test('schedule for members when payment is destroyed', async () => {
      const payment = await ah.api.models.payment.create(generatePayment({paymentType: 'TEMPORARY', members: [1]}))
      expect(payment.id).toBeTruthy()
      const action = 'payment:destroy'
      const params = {paymentId: payment.id}
      const response = await ah.runAdminAction(action, params)
      expect(response).toBeSuccessAction()
      expect(enqueueSpy).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({id: 1})]))
    })
  })
})
