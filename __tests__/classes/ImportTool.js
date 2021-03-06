// eslint-disable-next-line no-unused-vars
/* globals describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const ah = require('../../test/ah-setup')
const ImportTool = require('../../classes/ImportTool')
const { DataTypes } = require('sequelize')
const { assign } = Object

describe('import models', () => {
  const importer = new ImportTool()
  let model

  const importResult = expectedResult => {
    return expect.objectContaining({
      errors: 0,
      success: true,
      ...expectedResult
    })
  }

  const importModel = importData => {
    return importer.import(model, importData)
  }

  const generateImportModel = (opts) => {
    const i = generateImportModel.index++
    return assign({
      field1: `field1 value ${i}`,
      field2: `field2 value ${i}`,
      unique1: `unique1 value ${i}`,
      unique2: `${i}`,
      requiredField: '123'
    }, opts)
  }
  generateImportModel.index = 0

  const generateImportData = (opts) => {
    return assign({
      create: false,
      update: false,
      failOnError: false,
      dryRun: false,
      data: [
        generateImportModel()
      ]
    }, opts)
  }

  beforeAll(async () => {
    await ah.start()

    model = ah.api.sequelize.sequelize.define('TestImportModel', {
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
        unique: { msg: 'The specified value is already in use.' }
      },
      unique2: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: { msg: 'The specified value is already in use.' }
      },
      number1: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      requiredField: {
        type: DataTypes.STRING,
        allowNull: false
      }
    })
    await model.sync()
  })
  afterAll(async () => {
    await ah.api.sequelize.sequelize.queryInterface.dropTable(model.tableName)
    await ah.stop()
  })

  beforeEach(async () => {
    await model.destroy({ where: {}, force: true })
  })

  test('should import model', async () => {
    await importer.import(model, generateImportData({ create: true }))
    await expect(model.count()).resolves.toBe(1)
  })

  describe('consider create in input settings', () => {
    test('should insert new records', async () => {
      expect(await importModel(generateImportData({
        create: true
      }))).toEqual(importResult({
        inserts: 1
      }))
    })

    test('should skip existing records', async () => {
      // create new record
      const record = generateImportModel()
      await model.create(record)

      // try import the same record
      expect(await importModel(generateImportData({
        create: true,
        data: [record]
      }))).toEqual(importResult({
        inserts: 0,
        ignored: 1
      }))
    })

    test('should skip new records if disabled', async () => {
      expect(await importModel(generateImportData({
        create: false
      }))).toEqual(importResult({
        inserts: 0,
        ignored: 1
      }))
    })
  })

  describe('consider update in input settings', () => {
    test('should update existing records', async () => {
      // create new record
      const record = generateImportModel()
      await model.create(record)

      // update some field on the prepared for import model
      const recordForImport = Object.assign({}, record, { field2: 'new address' })

      // check import result
      expect(await importModel(generateImportData({
        update: true,
        data: [recordForImport]
      }))).toEqual(importResult({
        updates: 1,
        ignored: 0
      }))

      // check updated field in db
      const importedRecord = await model.findOne()
      expect(importedRecord.field2).toBe(recordForImport.field2)
    })

    test('should skip new records', async () => {
      // create new record
      const record = generateImportModel()
      await model.create(record)

      expect(await importModel(generateImportData({
        update: true
      }))).toEqual(importResult({
        updates: 0,
        ignored: 1
      }))

      await expect(model.count()).resolves.toBe(1)
    })

    test('should skip existing records if disabled', async () => {
      // create new record
      const record = generateImportModel()
      await model.create(record)

      // update some field on the prepared for import record
      const recordForImport = Object.assign({}, record, { field1: 'new field1 value' })

      // check import result
      expect(await importModel(generateImportData({
        update: false,
        data: [recordForImport]
      }))).toEqual(importResult({
        updates: 0,
        ignored: 1
      }))

      // check field is not updated in db
      const importedRecord = await model.findOne()
      expect(importedRecord.field1).toBe(record.field1)
    })
  })

  describe('consider failOnError in input settings', () => {
    test('should not modify database on error when enabled', async () => {
      expect(await importModel(generateImportData({
        create: true,
        failOnError: true,
        data: [
          generateImportModel({ requiredField: null })
        ]
      }))).toEqual(importResult({
        inserts: 0,
        errors: 1,
        success: false
      }))

      await expect(model.count()).resolves.toBe(0)
    })

    test('should insert only valid rows without error when disabled', async () => {
      expect(await importModel(generateImportData({
        create: true,
        failOnError: false,
        data: [
          generateImportModel(),
          generateImportModel({ requiredField: null })
        ]
      }))).toEqual(importResult({
        inserts: 1,
        ignored: 0,
        errors: 1,
        success: true
      }))
    })
  })

  describe('consider dryRun in input settings', () => {
    test('should not modify database when enabled', async () => {
      expect(await importModel(generateImportData({
        create: true,
        dryRun: true,
        data: [
          generateImportModel()
        ]
      }))).toEqual(importResult({
        inserts: 1,
        ignored: 0,
        errors: 0,
        dryRun: true,
        success: true
      }))

      await expect(model.count()).resolves.toBe(0)
    })

    test('should not modify database when enabled and failOnError is enabled, but no errors detected', async () => {
      expect(await importModel(generateImportData({
        create: true,
        dryRun: true,
        failOnError: true,
        data: [
          generateImportModel()
        ]
      }))).toEqual(importResult({
        inserts: 1,
        ignored: 0,
        errors: 0,
        dryRun: true,
        success: true
      }))

      await expect(model.count()).resolves.toBe(0)
    })
  })

  describe('consider defaults in input settings', () => {
    const invalidValues = [
      { field1: null },
      { field1: undefined },
      { field1: '' }
    ]

    const validValues = [
      { field1: 'row value' },
      { field1: '0' }
    ]

    invalidValues.forEach(value => {
      test(`should use default value if row value is ${value.field1}`, async () => {
        expect(await importModel(generateImportData({
          create: true,
          defaults: {
            field1: 'some default value'
          },
          data: [
            generateImportModel(value)
          ]
        }))).toEqual(importResult())

        const importedRecord = await model.findOne()
        expect(importedRecord.field1).toBe('some default value')
      })
    })

    validValues.forEach(value => {
      test(`should use row value if row value is ${value.field1}`, async () => {
        expect(await importModel(generateImportData({
          create: true,
          defaults: {
            field1: 'some default value'
          },
          data: [
            generateImportModel(value)
          ]
        }))).toEqual(importResult())

        const importedRecord = await model.findOne()
        expect(importedRecord.field1).toBe(value.field1)
      })
    })

    test(`should use row value if is 0 for integer field`, async () => {
      expect(await importModel(generateImportData({
        create: true,
        defaults: {
          number1: 1
        },
        data: [
          generateImportModel({
            number1: 0
          })
        ]
      }))).toEqual(importResult())

      const importedRecord = await model.findOne()
      expect(importedRecord.number1).toBe(0)
    })
  })

  describe('identify record', () => {
    const modelParams = {
      unique1: null,
      unique2: null
    }

    test('should match model by internal id', async () => {
      const record = generateImportModel()
      const record2 = generateImportModel()

      const recordId = (await model.create(record)).id
      const record2Id = (await model.create(record2)).id

      expect(await importModel(generateImportData({
        update: true,
        data: [
          generateImportModel({
            id: recordId,
            field1: 'new value'
          })
        ]
      }))).toEqual(importResult({
        updates: 1
      }))

      expect((await model.findById(recordId)).field1).toEqual('new value')
      expect((await model.findById(record2Id)).field1).toEqual(record2.field1)
    })

    test('should match model by unique field', async () => {
      const record = generateImportModel(Object.assign({}, modelParams, { unique1: 999 }))
      const record2 = generateImportModel(Object.assign({}, modelParams, { unique1: 998 }))

      const recordId = (await model.create(record)).id
      const record2Id = (await model.create(record2)).id

      expect(await importModel(generateImportData({
        update: true,
        data: [
          generateImportModel({
            unique1: record.unique1,
            field1: 'new value'
          })
        ]
      }))).toEqual(importResult({
        updates: 1
      }))

      expect((await model.findById(recordId)).field1).toEqual('new value')
      expect((await model.findById(record2Id)).field1).toEqual(record2.field1)
    })

    test('should not match record if none unique field is matching', async () => {
      const record = generateImportModel()
      await model.create(record)

      expect(await importModel(generateImportData({
        update: true,
        data: [
          generateImportModel()
        ]
      }))).toEqual(importResult({
        updates: 0,
        ignored: 1
      }))
    })

    test('should fail if match more than one record by more unique fields', async () => {
      const record = generateImportModel(Object.assign({}, modelParams, { unique1: 999 }))
      await model.create(record)

      const record2 = generateImportModel(Object.assign({}, modelParams, { unique2: 999 }))
      await model.create(record2)

      expect(await importModel(generateImportData({
        update: true,
        data: [
          generateImportModel({ unique1: record.unique1, unique2: record2.unique2 })
        ]
      }))).toEqual(importResult({
        updates: 0,
        errors: 1
      }))
    })

    describe('by composite key', async () => {
      let modelWithComposite

      beforeAll(async () => {
        modelWithComposite = ah.api.sequelize.sequelize.define('TestImportModelWithComposite', {
          field1: {
            type: DataTypes.STRING,
            allowNull: true
          },
          keyPart1: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            unique: 'compositeKey'
          },
          keyPart2: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: 'compositeKey'
          }
        })
        await modelWithComposite.sync()
      })

      afterAll(async () => {
        await ah.api.sequelize.sequelize.queryInterface.dropTable(modelWithComposite.tableName)
      })

      afterEach(async () => {
        await modelWithComposite.destroy({ where: {}, force: true })
      })

      test('should match model by composite key', async () => {
        await modelWithComposite.create({
          field1: 'some value',
          keyPart1: 'part1 val1',
          keyPart2: 'part2 val1'
        })
        const createdRecord2 = await modelWithComposite.create({
          field1: 'some value 2',
          keyPart1: 'part1 val1',
          keyPart2: 'part2 val2'
        })
        await modelWithComposite.create({
          field1: 'some value 2',
          keyPart1: 'part1 val2',
          keyPart2: 'part2 val2'
        })

        expect(await importer.import(modelWithComposite, generateImportData({
          update: true,
          data: [
            {
              field1: 'some updated value',
              keyPart1: 'part1 val1',
              keyPart2: 'part2 val2'
            }
          ]
        }))).toEqual(importResult({
          updates: 1
        }))

        await createdRecord2.reload()
        expect(createdRecord2.field1).toBe('some updated value')
      })

      test('should fail if provide partial composite key', async () => {
        await modelWithComposite.create({
          field1: 'some value',
          keyPart1: 'part1 val1',
          keyPart2: 'part2 val1'
        })
        await modelWithComposite.create({
          field1: 'some value 2',
          keyPart1: 'part1 val2',
          keyPart2: 'part2 val2'
        })

        expect(await importer.import(modelWithComposite, generateImportData({
          update: true,
          data: [
            {
              field1: 'some updated value',
              keyPart1: 'part1 val1'
            }
          ]
        }))).toEqual(importResult({
          errors: 1
        }))
      })
    })
  })

  describe('result', () => {
    test('should show number of rows inserted', async () => {
      expect(await importModel(generateImportData({
        create: true
      }))).toEqual(importResult({
        inserts: 1,
        updates: 0,
        ignored: 0,
        errors: 0
      }))
    })

    test('should show number of rows updated', async () => {
      const record = generateImportModel()
      await model.create(record)

      expect(await importModel(generateImportData({
        update: true,
        data: [
          record
        ]
      }))).toEqual(importResult({
        inserts: 0,
        updates: 1,
        ignored: 0,
        errors: 0
      }))
    })

    test('should show number of rows ignored', async () => {
      const record = generateImportModel()
      await model.create(record)

      expect(await importModel(generateImportData({
        update: false,
        data: [
          record
        ]
      }))).toEqual(importResult({
        inserts: 0,
        updates: 0,
        ignored: 1,
        errors: 0
      }))
    })

    test('should show number of total rows in the file', async () => {
      expect(await importModel(generateImportData({
        update: false,
        data: [
          generateImportModel(),
          generateImportModel(),
          generateImportModel()
        ]
      }))).toEqual(importResult({
        totalRows: 3
      }))
    })

    test('should show number of errors', async () => {
      expect(await importModel(generateImportData({
        create: true,
        data: [
          generateImportModel({ requiredField: null })
        ]
      }))).toEqual(importResult({
        errors: 1
      }))
    })

    test('should show errors per row', async () => {
      expect(await importModel(generateImportData({
        create: true,
        data: [
          generateImportModel(),
          generateImportModel({ requiredField: null })
        ]
      }))).toEqual(importResult({
        inserts: 1,
        errors: 1,
        errorDetails: [
          {
            row: 3,
            error: expect.any(String)
          }
        ]
      }))
    })
  })

  describe('manage model relations', async () => {
    let modelB

    beforeAll(async () => {
      modelB = ah.api.sequelize.sequelize.define('TestImportModelB', {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        modelRelationId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false
        },
        field: {
          type: DataTypes.STRING,
          allowNull: true
        }
      })
      modelB.belongsTo(model, { as: 'modelRelation' })
      await modelB.sync()
    })

    afterAll(async () => {
      await ah.api.sequelize.sequelize.queryInterface.dropTable(modelB.tableName)
    })

    afterEach(async () => {
      await modelB.destroy({ where: {}, force: true })
      await model.destroy({ where: {}, force: true })
    })

    test('should match model by given relation', async () => {
      const recordA = generateImportModel({ unique1: '999' })
      const recordAId = (await model.create(recordA)).id

      const recordB = {
        field: 'some value',
        'modelRelation.unique1': recordA.unique1
      }

      expect(await importer.import(modelB, generateImportData({
        create: true,
        data: [
          recordB
        ]
      }))).toEqual(importResult({
        inserts: 1
      }))

      const importedRecordB = await modelB.findOne()
      expect(importedRecordB).toEqual(expect.objectContaining({ modelRelationId: recordAId }))
    })

    test('should fail if related model is not found', async () => {
      const recordA = generateImportModel({ unique1: '999' })
      await model.create(recordA)
      const recordB = {
        field: 'some value',
        'modelRelation.unique1': '888'
      }

      expect(await importer.import(modelB, generateImportData({
        create: true,
        data: [
          recordB
        ]
      }))).toEqual(importResult({
        errors: 1
      }))

      expect(await modelB.count()).toBe(0)
    })

    test('should fail if more than one relation model found', async () => {
      await model.create(generateImportModel({ field1: 'value' }))
      await model.create(generateImportModel({ field1: 'value' }))
      const recordB = {
        field: 'some value',
        'modelRelation.field1': 'value'
      }

      expect(await importer.import(modelB, generateImportData({
        create: true,
        data: [
          recordB
        ]
      }))).toEqual(importResult({
        errors: 1
      }))

      expect(await modelB.count()).toBe(0)
    })

    test('should fail if relationship is non existing', async () => {
      await model.create(generateImportModel({ field1: 'value' }))
      const recordB = {
        field: 'some value',
        'missingRelation.field1': 'value'
      }

      expect(await importer.import(modelB, generateImportData({
        create: true,
        data: [
          recordB
        ]
      }))).toEqual(importResult({
        errors: 1
      }))

      expect(await modelB.count()).toBe(0)
    })
  })

  test('should nullify empty strings', async () => {
    expect(await importer.import(model, generateImportData({
      create: true,
      data: [
        generateImportModel({ requiredField: '' })
      ]
    }))).toEqual(importResult({
      errors: 1
    }))
  })

  test('should apply model transformations before match the record', async () => {
    let modelWithTransformations = ah.api.sequelize.sequelize.define('TestModelWithTransformations', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      field1: DataTypes.STRING,
      unique1: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        set (val) {
          this.setDataValue('unique1', '00' + val)
        }
      }
    })
    await modelWithTransformations.sync()

    await modelWithTransformations.create({ unique1: '111' })
    expect(await importer.import(modelWithTransformations, generateImportData({
      create: true,
      data: [
        { unique1: '111' },
        { unique1: '222' }
      ]
    }))).toEqual(importResult({
      errors: 0,
      inserts: 1,
      ignored: 1
    }))

    await ah.api.sequelize.sequelize.queryInterface.dropTable(modelWithTransformations.tableName)
  })

  test('should ignore empty rows', async () => {
    expect(await importer.import(model, generateImportData({
      create: true,
      data: [
        {}
      ]
    }))).toEqual(importResult({
      ignored: 1
    }))
  })

  describe('composite unique keys', () => {
    let compositeModel

    beforeEach(async () => {
      compositeModel = ah.api.sequelize.sequelize.define('TestImportModelWithCompositeUniqueKey', {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        field1: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: 'idx_composite'
        },
        field2: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: 'idx_composite'
        },
        field3: DataTypes.STRING
      })
      await compositeModel.sync()
    })

    afterEach(async () => {
      await ah.api.sequelize.sequelize.queryInterface.dropTable(compositeModel.tableName)
    })

    test('should import if not used', async () => {
      expect(await importer.import(compositeModel, {
        create: true,
        data: [
          { field3: 'dummy' }
        ]
      })).toEqual(importResult({
        inserts: 1
      }))
    })

    test('should report the missing field if not fully specified', async () => {
      expect(await importer.import(compositeModel, {
        create: true,
        data: [
          { field1: 'dummy' }
        ]
      })).toEqual(importResult({
        errors: 1,
        errorDetails: expect.arrayContaining([expect.objectContaining({ error: expect.stringContaining('field2') })])
      }))
    })
  })

  describe('duplicated record', () => {
    let testModel

    beforeEach(async () => {
      testModel = ah.api.sequelize.sequelize.define('TestImportModelForDuplicatedRecord', {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        unique1: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true
        },
        unique2: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true
        },
        composite1: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: 'idx_composite'
        },
        composite2: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: 'idx_composite'
        }
      })
      await testModel.sync()
    })

    afterEach(async () => {
      await ah.api.sequelize.sequelize.queryInterface.dropTable(testModel.tableName)
    })

    test('should report error', async () => {
      testModel.create({ unique1: 'value1' })
      testModel.create({ unique2: 'value2' })

      const { errorDetails: [{ error }] } = await importer.import(testModel, {
        create: true,
        data: [
          { unique1: 'value1', unique2: 'value2' }
        ]
      })
      expect(error).toMatchSnapshot()
    })

    test('should report the duplicated fields', async () => {
      testModel.create({ unique1: 'duplicate' })
      testModel.create({ unique2: 'duplicate' })

      const { errorDetails: [{ error }] } = await importer.import(testModel, {
        create: true,
        data: [
          { unique1: 'duplicate', unique2: 'duplicate' }
        ]
      })

      expect(error).toContain('unique1')
      expect(error).toContain('unique2')
    })

    test('should report the duplicated values', async () => {
      testModel.create({ unique1: 'val1' })
      testModel.create({ unique2: 'val2' })

      const { errorDetails: [{ error }] } = await importer.import(testModel, {
        create: true,
        data: [
          { unique1: 'val1', unique2: 'val2' }
        ]
      })

      expect(error).toContain('val1')
      expect(error).toContain('val2')
    })
  })
})
