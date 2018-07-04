// eslint-disable-next-line no-unused-vars
/* globals describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const ImportTool = require('../../classes/ImportTool')
const {DataTypes} = require('sequelize')
const {assign} = Object

describe('import models', () => {
  const importer = new ImportTool()
  let model

  const checkImportResult = async (importData, expectedResult) => {
    const checkResult = Object.assign({
      errors: 0,
      success: true,
      totalRows: importData.data.length
    }, expectedResult)
    const result = await importer.import(model, importData)
    expect(result).toEqual(expect.objectContaining(checkResult))
  }

  const generateImportModel = (opts) => {
    const i = generateImportModel.index++
    return assign({
      field1: `field1 value ${i}`,
      field2: `field2 value ${i}`,
      unique1: `unique1 value ${i}`,
      unique2: `${i}`
    }, opts)
  }
  generateImportModel.index = 0

  const generateImportData = (opts) => {
    return assign({
      createNew: false,
      updateExisting: false,
      failOnError: false,
      dryRun: false,
      data: [
        generateImportModel()
      ]
    }, opts)
  }

  beforeAll(async () => {
    await ah.start()

    model = ah.api.sequelize.sequelize.define('Model', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      field1: {
        type: DataTypes.STRING,
        allowNull: true
      },
      field2: {
        type: DataTypes.STRING,
        allowNull: true
      },
      unique1: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: {msg: 'The specified value is already in use.'}
      },
      unique2: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: {msg: 'The specified value is already in use.'}
      }
    })
    await model.sync()
  })
  afterAll(ah.stop)

  beforeEach(async () => {
    await model.destroy({where: {}, force: true})
  })

  test('should import model', async () => {
    await importer.import(model, generateImportData({createNew: true}))
    await expect(model.count()).resolves.toBe(1)
  })

  describe('consider createNew in input settings', () => {
    test('should insert new records', async () => {
      await checkImportResult(generateImportData({createNew: true}), {
        inserts: 1
      })
    })

    test('should skip existing records', async () => {
      // create new record
      const record = generateImportModel()
      await model.create(record)

      // try import the same record
      await checkImportResult(generateImportData({createNew: true, data: [record]}), {
        inserts: 0,
        ignored: 1
      })
    })

    test('should skip new records if disabled', async () => {
      await checkImportResult(generateImportData({createNew: false}), {
        inserts: 0,
        ignored: 1
      })
    })
  })

  describe('consider updateExisting in input settings', () => {
    test('should update existing records', async () => {
      // create new record
      const record = generateImportModel()
      await model.create(record)

      // update some field on the prepared for import model
      const recordForImport = Object.assign({}, record, {field2: 'new address'})

      // check import result
      await checkImportResult(generateImportData({updateExisting: true, data: [recordForImport]}), {
        updates: 1,
        ignored: 0
      })

      // check updated field in db
      const importedRecord = await model.findOne()
      expect(importedRecord.field2).toBe(recordForImport.field2)
    })

    test('should skip new records', async () => {
      // create new record
      const record = generateImportModel()
      await model.create(record)

      await checkImportResult(generateImportData({updateExisting: true}), {
        updates: 0,
        ignored: 1
      })

      await expect(model.count()).resolves.toBe(1)
    })

    test('should skip existing records if disabled', async () => {
      // create new record
      const record = generateImportModel()
      await model.create(record)

      // update some field on the prepared for import record
      const recordForImport = Object.assign({}, record, {field1: 'new field1 value'})

      // check import result
      await checkImportResult(generateImportData({updateExisting: false, data: [recordForImport]}), {
        updates: 0,
        ignored: 1
      })

      // check field is not updated in db
      const importedRecord = await model.findOne()
      expect(importedRecord.field1).toBe(record.field1)
    })
  })

  describe('consider failOnError in input settings', () => {
    test('should not modify database on error when enabled', async () => {
      await checkImportResult(generateImportData({
        createNew: true,
        failOnError: true,
        data: [
          generateImportModel({unique1: '999'}),
          generateImportModel({unique1: '999'})
        ]
      }), {
        inserts: 0,
        errors: 1,
        success: false
      })

      await expect(model.count()).resolves.toBe(0)
    })

    test('should insert only valid rows without error when disabled', async () => {
      await checkImportResult(generateImportData({
        createNew: true,
        failOnError: false,
        data: [
          generateImportModel({unique1: '999'}),
          generateImportModel({unique1: '999'})
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
          generateImportModel()
        ]
      }), {
        inserts: 1,
        ignored: 0,
        errors: 0,
        dryRun: true,
        success: true
      })

      await expect(model.count()).resolves.toBe(0)
    })
  })

  describe('consider defaultValues in input settings', () => {
    test('should use default values if set in input setting and missing in row data', async () => {
      await checkImportResult(generateImportData({
        createNew: true,
        defaultValues: {
          field2: 'some default value'
        },
        data: [
          generateImportModel({field2: null})
        ]
      }))

      const importedRecord = await model.findOne()
      expect(importedRecord.field2).toBe('some default value')
    })

    test('should use row value if existing instead of using default set in input settings', async () => {
      await checkImportResult(generateImportData({
        createNew: true,
        defaultValues: {
          field2: 'some default value'
        },
        data: [
          generateImportModel({field2: 'row value'})
        ]
      }))

      const importedRecord = await model.findOne()
      expect(importedRecord.field2).toBe('row value')
    })
  })

  describe('match record by unique field', () => {
    const modelParams = {
      unique1: null,
      unique2: null
    }

    test('should match record by internal id', async () => {
      const record = generateImportModel(modelParams)
      const recordId = (await model.create(record)).id
      await checkImportResult(generateImportData({
        updateExisting: true,
        data: [
          generateImportModel({id: recordId})
        ]
      }), {
        updates: 1
      })
    })

    test('should match model by unique field', async () => {
      const record = generateImportModel(Object.assign({}, modelParams, {unique1: 999}))
      await model.create(record)

      await checkImportResult(generateImportData({
        updateExisting: true,
        data: [
          generateImportModel({unique1: record.unique1})
        ]
      }), {
        updates: 1
      })
    })

    test('should not match record if none unique field is matching', async () => {
      const record = generateImportModel()
      await model.create(record)

      await checkImportResult(generateImportData({
        updateExisting: true,
        data: [
          generateImportModel()
        ]
      }), {
        updates: 0,
        ignored: 1
      })
    })

    test('should fail if match more than one record by more unique fields', async () => {
      const record = generateImportModel(Object.assign({}, modelParams, {unique1: 999}))
      await model.create(record)

      const record2 = generateImportModel(Object.assign({}, modelParams, {unique2: 999}))
      await model.create(record2)

      await checkImportResult(generateImportData({
        updateExisting: true,
        data: [
          generateImportModel({unique1: record.unique1, unique2: record2.unique2})
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
      const record = generateImportModel()
      await model.create(record)

      await checkImportResult(generateImportData({
        updateExisting: true,
        data: [
          record
        ]
      }), {
        inserts: 0,
        updates: 1,
        ignored: 0,
        errors: 0
      })
    })

    test('should show number of rows ignored', async () => {
      const record = generateImportModel()
      await model.create(record)

      await checkImportResult(generateImportData({
        updateExisting: false,
        data: [
          record
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
          generateImportModel(),
          generateImportModel(),
          generateImportModel()
        ]
      }), {
        totalRows: 3
      })
    })

    test('should show number of errors', async () => {
      await checkImportResult(generateImportData({
        createNew: true,
        data: [
          generateImportModel({unique1: '999'}),
          generateImportModel({unique1: '999'})
        ]
      }), {
        errors: 1
      })
    })

    test('should show errors per row', async () => {
      await checkImportResult(generateImportData({
        createNew: true,
        data: [
          generateImportModel({unique1: '999'}),
          generateImportModel({unique1: '999'})
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
