// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const { snapshot, testActionPermissions, testFieldChange, testPaging } = require('../../test/helpers')
const { assign } = Object
const { generateMember, generatePayment } = require('../../test/generators')
const format = require('date-fns/format')
const addDays = require('date-fns/add_days')
const subDays = require('date-fns/sub_days')

describe('action member', () => {
  beforeAll(ah.start)
  afterAll(ah.stop)

  describe('#list', () => {
    const action = 'member:list'

    testActionPermissions(action, {}, { guest: false, user: false, admin: true })

    test('should return list of members', async () => {
      const member = await ah.api.models.member.findOne({})
      const res = await ah.runAdminAction(action)
      expect(res).toHaveProperty('data', expect.arrayContaining([
        expect.objectContaining({
          id: member.id,
          firstName: member.firstName,
          middleName: member.middleName,
          lastName: member.lastName,
          username: member.username,
          email: member.email,
          phone: member.phone
        })
      ]))
    })

    describe('ordering', async () => {
      let firstMember
      let secondMember

      beforeAll(async () => {
        firstMember = await ah.api.models.member.create(generateMember({ firstName: 'ABC_Name', lastName: 'Member' }))
        secondMember = await ah.api.models.member.create(generateMember({ firstName: 'ZYX_Name', lastName: 'Member' }))
      })

      afterAll(async () => {
        await firstMember.destroy({ force: true })
        await secondMember.destroy({ force: true })
      })

      test('should return ordered list of members by single key ascending', async () => {
        const response = await ah.runAdminAction(action, { order: 'firstName', asc: 'true' })
        const { data } = response
        expect(data[0]).toEqual(expect.objectContaining({ firstName: firstMember.firstName }))
      })

      test('should return ordered list of members by single key descending', async () => {
        const response = await ah.runAdminAction(action, { order: 'firstName', asc: 'false' })
        const { data } = response
        expect(data[0]).toEqual(expect.objectContaining({ firstName: secondMember.firstName }))
      })

      test('should return ordered list of members by multi key ascending', async () => {
        const response = await ah.runAdminAction(action, { order: 'lastName+firstName', asc: 'true' })
        const { data } = response
        expect(data[0]).toEqual(expect.objectContaining({ firstName: firstMember.firstName }))
      })

      test('should return ordered list of members by multi key descending', async () => {
        const response = await ah.runAdminAction(action, { order: 'lastName+firstName', asc: 'false' })
        const { data } = response
        expect(data[0]).toEqual(expect.objectContaining({ firstName: secondMember.firstName }))
      })
    })

    testPaging(action, 'member', () => {
      return generateMember({ firstName: 'TEMPORARY' })
    }, { firstName: 'TEMPORARY' })

    describe('filtering', () => {
      describe('q', () => {
        const STRING_FIELDS = ['firstName', 'username', 'middleName', 'lastName', 'accessId', 'cardId', 'country', 'city', 'postalCode', 'address', 'notes']
        const FIELDS = {
          email: { matchValue: 'mail@acme.org', noMatchValue: 'snail@physics.org' },
          phone: { matchValue: '+359897823456', noMatchValue: '+359879876543' },
          ...(STRING_FIELDS.reduce((agg, fieldName) => ({
            ...agg,
            [fieldName]: {
              matchValue: 'search',
              noMatchValue: 'no match'
            }
          }), {}))
        }

        const create = async ({ fieldName, value }) => {
          try {
            return await ah.api.models.member.create(generateMember({ [fieldName]: value }))
          } catch (e) {
            throw new Error(`Invalid ${fieldName} value ${value}: ${e.message} (${JSON.stringify(e)})`)
          }
        }

        const setup = async ({ fieldName, matchValue, noMatchValue }) => {
          return {
            memberMatch: await create({ fieldName, value: matchValue }),
            memberNotMatch: await create({ fieldName, value: noMatchValue })
          }
        }

        const testSearch = async ({ memberMatch, memberNotMatch, q }) => {
          try {
            const response = await ah.runAdminAction(action, { q, limit: -1 })
            expect(response).toBeSuccessAction()
            const { data } = response
            expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: memberMatch.id })]))
            expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: memberNotMatch.id })]))
          } finally {
            await memberMatch.destroy({ force: true })
            await memberNotMatch.destroy({ force: true })
          }
        }

        Object.keys(FIELDS).forEach(fieldName => {
          const field = FIELDS[fieldName]

          test(`should match ${fieldName}`, async () => {
            const { memberMatch, memberNotMatch } = await setup({ fieldName, ...field })
            await testSearch({ memberMatch, memberNotMatch, q: field.matchValue })
          })

          test(`should match case insensitive ${fieldName}`, async () => {
            const { memberMatch, memberNotMatch } = await setup({ fieldName, ...field })
            await testSearch({ memberMatch, memberNotMatch, q: field.matchValue.toUpperCase() })
          })

          test(`should match partial ${fieldName}`, async () => {
            const { memberMatch, memberNotMatch } = await setup({ fieldName, ...field })
            await testSearch({ memberMatch, memberNotMatch, q: field.matchValue.slice(1, -1) })
          })

          test(`should match terms ${fieldName}`, async () => {
            const { memberMatch, memberNotMatch } = await setup({ fieldName, ...field })
            await testSearch({ memberMatch, memberNotMatch, q: ` ${field.matchValue} ${field.matchValue} ` })
          })
        })
      })

      test('should match by given id selection', async () => {
        const member1 = await ah.api.models.member.create(generateMember())
        const member2 = await ah.api.models.member.create(generateMember())
        const member3 = await ah.api.models.member.create(generateMember())

        const response = await ah.runAdminAction(action, { selection: [member1.id, member3.id], limit: -1 })
        const { data } = response
        expect(data.length).toEqual(2)
        expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: member1.id })]))
        expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: member3.id })]))

        await member1.destroy({ force: true })
        await member2.destroy({ force: true })
        await member3.destroy({ force: true })
      })

      test(`should match by category`, async () => {
        const regularMember = await ah.api.models.member.create(generateMember({ category: 'regular' }))
        const studentMember = await ah.api.models.member.create(generateMember({ category: 'student' }))
        const response = await ah.runAdminAction(action, { category: 'student', limit: -1 })
        expect(response).toBeSuccessAction()
        const { data } = response
        expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: studentMember.id })]))
        expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: regularMember.id })]))
      })

      test(`should match by expired membership`, async () => {
        const notExpiredMember = await ah.api.models.member.create(generateMember({ membershipEndDate: format(addDays(new Date(), 2), 'YYYY-MM-DD') }))
        const expiredMember = await ah.api.models.member.create(generateMember({ membershipEndDate: format(subDays(new Date(), 2), 'YYYY-MM-DD') }))
        const response = await ah.runAdminAction(action, { membership: 'expired', limit: -1 })
        expect(response).toBeSuccessAction()
        const { data } = response
        expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: expiredMember.id })]))
        expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: notExpiredMember.id })]))
      })

      test(`should match by active membership`, async () => {
        const notExpiredMember = await ah.api.models.member.create(generateMember({ membershipEndDate: format(addDays(new Date(), 2), 'YYYY-MM-DD') }))
        const expiredMember = await ah.api.models.member.create(generateMember({ membershipEndDate: format(subDays(new Date(), 2), 'YYYY-MM-DD') }))
        const response = await ah.runAdminAction(action, { membership: 'active', limit: -1 })
        expect(response).toBeSuccessAction()
        const { data } = response
        expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: notExpiredMember.id })]))
        expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: expiredMember.id })]))
      })

      describe(`payment date`, () => {
        let member1, member2, member3

        beforeEach(async () => {
          member1 = await ah.api.models.member.create(generateMember())
          member2 = await ah.api.models.member.create(generateMember())
          member3 = await ah.api.models.member.create(generateMember())
        })

        afterEach(async () => {
          await member1.destroy({ force: true })
          await member2.destroy({ force: true })
          await member3.destroy({ force: true })
        })

        test(`should match only members with payment date later than given fromDate`, async () => {
          await ah.api.models.payment.create(generatePayment({
            paymentDate: '2000-01-05',
            members: [member1.id]
          }))
          await ah.api.models.payment.create(generatePayment({
            paymentDate: '2000-01-10',
            members: [member2.id]
          }))

          const response = await ah.runAdminAction(action, { paymentFromDate: '2000-01-07' })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: member2.id })]))
          expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: member1.id })]))
        })

        test(`should match only members with payment date earlier than given toDate`, async () => {
          await ah.api.models.payment.create(generatePayment({
            paymentDate: '2000-01-05',
            members: [member1.id]
          }))
          await ah.api.models.payment.create(generatePayment({
            paymentDate: '2000-01-10',
            members: [member2.id]
          }))

          const response = await ah.runAdminAction(action, { paymentToDate: '2000-01-07' })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: member1.id })]))
          expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: member2.id })]))
        })

        test(`should match members with payment date equal to fromDate`, async () => {
          await ah.api.models.payment.create(generatePayment({
            paymentDate: '2000-01-05',
            members: [member1.id]
          }))

          const response = await ah.runAdminAction(action, { paymentFromDate: '2000-01-05' })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: member1.id })]))
        })

        test(`should match members with payment date equal to toDate`, async () => {
          await ah.api.models.payment.create(generatePayment({
            paymentDate: '2000-01-05',
            members: [member1.id]
          }))

          const response = await ah.runAdminAction(action, { paymentToDate: '2000-01-05' })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: member1.id })]))
        })

        test(`should match only members with payment date between from and to dates`, async () => {
          await ah.api.models.payment.create(generatePayment({
            paymentDate: '2000-01-05',
            members: [member1.id]
          }))
          await ah.api.models.payment.create(generatePayment({
            paymentDate: '2000-01-10',
            members: [member2.id]
          }))

          const response = await ah.runAdminAction(action, {
            paymentFromDate: '2000-01-03',
            paymentToDate: '2000-01-07'
          })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: member1.id })]))
          expect(data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: member2.id })]))
        })

        test(`should match all members related to a payment in the given interval`, async () => {
          await ah.api.models.payment.create(generatePayment({
            paymentDate: '2000-01-05',
            members: [member1.id, member3.id]
          }))
          await ah.api.models.payment.create(generatePayment({
            paymentDate: '2000-01-10',
            members: [member2.id]
          }))

          const response = await ah.runAdminAction(action, {
            paymentFromDate: '2000-01-03',
            paymentToDate: '2000-01-07'
          })
          expect(response).toBeSuccessAction()
          const { data } = response
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: member1.id })]))
          expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ id: member3.id })]))
        })
      })
    })
  })

  describe('#destroy', () => {
    let member
    const action = 'member:destroy'
    const params = async () => { return { memberId: member.id } }

    beforeEach(async () => {
      member = await ah.api.models.member.create(generateMember())
    })

    afterEach(async () => {
      await ah.api.models.member.destroy({ where: { id: member.id }, force: true })
    })

    testActionPermissions(action, params, { guest: false, user: false, admin: true })

    test('should delete from db', async () => {
      await ah.runAdminAction(action, await params())
      const record = await ah.api.models.member.findOne({ where: { id: member.id } })
      expect(record).toBeFalsy()
    })
  })

  describe('#show', () => {
    const action = 'member:show'
    const params = async () => { return { memberId: (await ah.api.models.member.findOne({})).id } }

    testActionPermissions(action, params, { guest: false, user: false, admin: true })

    test('should contain all initial fields', async () => {
      const rawData = generateMember()
      const member = await ah.api.models.member.create(rawData)

      const response = await ah.runAdminAction(action, { memberId: member.id })

      expect(response).toHaveProperty('data', expect.objectContaining(rawData))
    })

    test('should match snapshot', async () => {
      const member = await ah.api.models.member.findOne({ order: [['id', 'ASC']] })
      const response = await ah.runAdminAction(action, { memberId: member.id })
      snapshot(response.data)
    })
  })

  describe('#update', () => {
    let member
    let updatedParams
    const action = 'member:update'
    const params = async () => { return assign({ memberId: member.id }, updatedParams) }

    beforeEach(async () => {
      member = await ah.api.models.member.create(generateMember())
      updatedParams = generateMember()
      for (let key in updatedParams) {
        if (!updatedParams.hasOwnProperty(key)) continue
        // category is different everytime
        if (key === 'category') continue
        // email could be null and we need to provide valid email
        if (key === 'email' && !updatedParams.email) updatedParams.email = 'old@email.com'
        if (key === 'phone') {
          updatedParams.phone = '+359896222111'
          continue
        }
        if (key === 'membershipStartDate') {
          updatedParams.membershipStartDate = '2016-05-20'
          continue
        }
        updatedParams[key] = `Updated${updatedParams[key]}`
      }
    })

    afterEach(async () => {
      await ah.api.models.member.destroy({ where: { id: member.id }, force: true })
    })

    testActionPermissions(action, params, { guest: false, user: false, admin: true })

    const fields = [
      'firstName', 'middleName', 'lastName', 'username', 'email', 'accessId', 'cardId',
      'country', 'city', 'postalCode', 'address', 'phone', 'category', 'membershipStartDate', 'notes'
    ]
    fields.forEach(field =>
      testFieldChange(
        // get request
        'member:show', () => { return { memberId: member.id } },
        // update request
        action, params,
        // field that should change
        field)
    )
  })

  describe('#create', () => {
    const action = 'member:create'
    const params = generateMember({ firstName: 'TEMPORARY' })

    afterEach(async () => {
      ah.api.models.member.destroy({ where: { firstName: 'TEMPORARY' }, force: true })
    })

    testActionPermissions(action, params, { guest: false, user: false, admin: true })

    describe('when created new member', () => {
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
          getResponse = await ah.runAdminAction('member:show', { memberId: response.data.id })
        })

        test('should succeed', async () => {
          expect(getResponse).toBeSuccessAction()
        })

        test('should have the provided properties', async () => {
          expect(getResponse.data).toEqual(expect.objectContaining(params))
        })
      })
    })
  })
})
