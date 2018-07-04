// eslint-disable-next-line no-unused-vars
/* globals describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const ImportTool = require('../../classes/ImportTool')
const {generateMember} = require('../../test/generators')
const {generateImportData} = require('../../test/generators')

describe('import members', () => {
  const importer = new ImportTool()

  beforeAll(async () => {
    await ah.start()
  })
  afterAll(ah.stop)

  const checkImportResult = async (importData, expectedResult) => {
    const checkResult = Object.assign({
      errors: 0,
      success: true,
      totalRows: importData.data.length
    }, expectedResult)
    const result = await importer.import(ah.api.models.member, importData)
    expect(result).toEqual(expect.objectContaining(checkResult))
  }

  beforeEach(async () => {
    await ah.api.models.payment.destroy({where: {}, force: true})
    await ah.api.models.member.destroy({where: {}, force: true})
  })

  test('should import members', async () => {
    await importer.import(ah.api.models.member, generateImportData({createNew: true}))
    await expect(ah.api.models.member.count()).resolves.toBe(1)
  })

  describe('consider createNew in input settings', () => {
    test('should insert new members', async () => {
      await checkImportResult(generateImportData({createNew: true}), {
        inserts: 1
      })
    })

    test('should skip existing members', async () => {
      // create new member
      const member = generateMember()
      await ah.api.models.member.create(member)

      // try import the same member
      await checkImportResult(generateImportData({createNew: true, data: [member]}), {
        inserts: 0,
        ignored: 1
      })
    })

    test('should skip new members if disabled', async () => {
      await checkImportResult(generateImportData({createNew: false}), {
        inserts: 0,
        ignored: 1
      })
    })
  })

  describe('consider updateExisting in input settings', () => {
    test('should update existing members', async () => {
      // create new member
      const member = generateMember()
      await ah.api.models.member.create(member)

      // update address field on the prepared for import member
      const memberForImport = Object.assign({}, member, {address: 'new address'})

      // check import result
      await checkImportResult(generateImportData({updateExisting: true, data: [memberForImport]}), {
        updates: 1,
        ignored: 0
      })

      // check updated field in db
      const importedMember = await ah.api.models.member.findOne()
      expect(importedMember.address).toBe(memberForImport.address)
    })

    test('should skip new members', async () => {
      // create new member
      const member = generateMember()
      await ah.api.models.member.create(member)

      await checkImportResult(generateImportData({updateExisting: true}), {
        updates: 0,
        ignored: 1
      })

      await expect(ah.api.models.member.count()).resolves.toBe(1)
    })

    test('should skip existing members if disabled', async () => {
      // create new member
      const member = generateMember()
      await ah.api.models.member.create(member)

      // update address field on the prepared for import member
      const memberForImport = Object.assign({}, member, {address: 'new address'})

      // check import result
      await checkImportResult(generateImportData({updateExisting: false, data: [memberForImport]}), {
        updates: 0,
        ignored: 1
      })

      // check field is not updated in db
      const importedMember = await ah.api.models.member.findOne()
      expect(importedMember.address).toBe(member.address)
    })
  })

  describe('consider failOnError in input settings', () => {
    test('should not modify database on error when enabled', async () => {
      await checkImportResult(generateImportData({
        createNew: true,
        failOnError: true,
        data: [
          generateMember(),
          generateMember({phone: 'invalid phone'})
        ]
      }), {
        inserts: 0,
        errors: 1,
        success: false
      })

      await expect(ah.api.models.member.count()).resolves.toBe(0)
    })

    test('should insert only valid rows without error when disabled', async () => {
      await checkImportResult(generateImportData({
        createNew: true,
        failOnError: false,
        data: [
          generateMember({phone: 'invalid phone'}),
          generateMember()
        ]
      }), {
        inserts: 1,
        ignored: 0,
        errors: 1,
        success: true
      })
    })
  })

  describe('consider dryRun in input settings', () => {
    test('should not modify database when enabled', async () => {
      await checkImportResult(generateImportData({
        createNew: true,
        dryRun: true,
        data: [
          generateMember()
        ]
      }), {
        inserts: 1,
        ignored: 0,
        errors: 0,
        dryRun: true,
        success: true
      })

      await expect(ah.api.models.member.count()).resolves.toBe(0)
    })
  })

  describe('consider defaultCategory in input settings', () => {
    test('should use default category setting if set in input setting and missing in row data', async () => {
      await checkImportResult(generateImportData({
        createNew: true,
        defaultValues: {
          category: 'student'
        },
        data: [
          generateMember({category: null})
        ]
      }))

      const importedMember = await ah.api.models.member.findOne()
      expect(importedMember.category).toBe('student')
    })

    test('should use row value for category if existing instead of using default set in input settings', async () => {
      await checkImportResult(generateImportData({
        createNew: true,
        defaultValues: {
          category: 'student'
        },
        data: [
          generateMember({category: 'regular'})
        ]
      }))

      const importedMember = await ah.api.models.member.findOne()
      expect(importedMember.category).toBe('regular')
    })
  })

  describe('match member by unique field', () => {
    const memberParams = {
      accessId: null,
      cardId: null,
      phone: null,
      username: null,
      email: null
    }

    test('should match member by internal id', async () => {
      const member = generateMember(memberParams)
      const memberId = (await ah.api.models.member.create(member)).id
      await checkImportResult(generateImportData({
        updateExisting: true,
        data: [
          generateMember({id: memberId})
        ]
      }), {
        updates: 1
      })
    })

    test('should match member by accessId', async () => {
      const member = generateMember(Object.assign({}, memberParams, {accessId: 999}))
      await ah.api.models.member.create(member)

      await checkImportResult(generateImportData({
        updateExisting: true,
        data: [
          generateMember({accessId: member.accessId})
        ]
      }), {
        updates: 1
      })
    })

    test('should match member by cardId', async () => {
      const member = generateMember(Object.assign({}, memberParams, {cardId: 999}))
      await ah.api.models.member.create(member)

      await checkImportResult(generateImportData({
        updateExisting: true,
        data: [
          generateMember({cardId: member.cardId})
        ]
      }), {
        updates: 1
      })
    })

    test('should match member by username', async () => {
      const member = generateMember(Object.assign({}, memberParams, {username: 'user1'}))
      await ah.api.models.member.create(member)

      await checkImportResult(generateImportData({
        updateExisting: true,
        data: [
          generateMember({username: member.username})
        ]
      }), {
        updates: 1
      })
    })

    test('should match member by email', async () => {
      const member = generateMember(Object.assign({}, memberParams, {email: 'test@test.com'}))
      await ah.api.models.member.create(member)

      await checkImportResult(generateImportData({
        updateExisting: true,
        data: [
          generateMember({email: member.email})
        ]
      }), {
        updates: 1
      })
    })

    test('should match member by phone', async () => {
      const member = generateMember(Object.assign({}, memberParams, {phone: '+359899123456'}))
      await ah.api.models.member.create(member)

      await checkImportResult(generateImportData({
        updateExisting: true,
        data: [
          generateMember({phone: member.phone})
        ]
      }), {
        updates: 1
      })
    })

    test('should not match member if none unique field is matching', async () => {
      const member = generateMember()
      await ah.api.models.member.create(member)

      await checkImportResult(generateImportData({
        updateExisting: true,
        data: [
          generateMember()
        ]
      }), {
        updates: 0,
        ignored: 1
      })
    })

    test('should fail if match more than one member by more unique fields', async () => {
      const member = generateMember(Object.assign({}, memberParams, {accessId: 999}))
      await ah.api.models.member.create(member)

      const member2 = generateMember(Object.assign({}, memberParams, {cardId: 999}))
      await ah.api.models.member.create(member2)

      await checkImportResult(generateImportData({
        updateExisting: true,
        data: [
          generateMember({accessId: member.accessId, cardId: member2.cardId})
        ]
      }), {
        updates: 0,
        errors: 1
      })
    })
  })

  describe('result', () => {
    test('should show number of rows inserted', async () => {
      await checkImportResult(generateImportData({
        createNew: true
      }), {
        inserts: 1,
        updates: 0,
        ignored: 0,
        errors: 0
      })
    })

    test('should show number of rows updated', async () => {
      const member = generateMember()
      await ah.api.models.member.create(member)

      await checkImportResult(generateImportData({
        updateExisting: true,
        data: [
          member
        ]
      }), {
        inserts: 0,
        updates: 1,
        ignored: 0,
        errors: 0
      })
    })

    test('should show number of rows ignored', async () => {
      const member = generateMember()
      await ah.api.models.member.create(member)

      await checkImportResult(generateImportData({
        updateExisting: false,
        data: [
          member
        ]
      }), {
        inserts: 0,
        updates: 0,
        ignored: 1,
        errors: 0
      })
    })

    test('should show number of total rows in the file', async () => {
      await checkImportResult(generateImportData({
        updateExisting: false,
        data: [
          generateMember(),
          generateMember(),
          generateMember()
        ]
      }), {
        totalRows: 3
      })
    })

    test('should show number of errors', async () => {
      await checkImportResult(generateImportData({
        createNew: true,
        data: [
          generateMember(),
          generateMember({phone: 'invalid phone'})
        ]
      }), {
        errors: 1
      })
    })

    test('should show errors per row', async () => {
      await checkImportResult(generateImportData({
        createNew: true,
        data: [
          generateMember(),
          generateMember({phone: 'invalid phone'})
        ]
      }), {
        inserts: 1,
        errors: 1,
        errorDetails: [
          {
            row: 2,
            error: expect.any(Error)
          }
        ]
      })
    })
  })
})
