// eslint-disable-next-line no-unused-vars
/* globals jest, describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */

const ah = require('../../test/ah-setup')
const SequenceGenerator = require('../../classes/SequenceGenerator')
const { DataTypes } = require('sequelize')

describe('SequenceGenerator', () => {
  let testModel

  beforeAll(ah.start)
  afterAll(ah.stop)

  beforeEach(async () => {
    testModel = ah.api.sequelize.sequelize.define('TestSequenceGeneratorModel', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      }
    })
    await testModel.sync()
  })

  afterEach(async () => {
    await ah.api.sequelize.sequelize.queryInterface.dropTable(testModel.tableName)
  })

  test('generates id', async () => {
    const generator = new SequenceGenerator({ model: testModel })
    const id = await generator.generateId()
    expect(id).toBeTruthy()
  })

  test('generates different ids', async () => {
    const generator = new SequenceGenerator({ model: testModel })
    const id1 = await generator.generateId()
    const id2 = await generator.generateId()
    expect(id1).not.toEqual(id2)
  })
})
