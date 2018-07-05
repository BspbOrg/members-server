const {api} = require('actionhero')
const {Sequelize} = require('sequelize')
const Op = Sequelize.Op
const csv = require('csv-parser')
const fs = require('fs')
const es = require('event-stream')

module.exports = class ImportTool {
  async import (model, input) {
    const result = {
      totalRows: 0,
      inserts: 0,
      updates: 0,
      errors: 0,
      ignored: 0,
      dryRun: !!input.dryRun,
      errorDetails: [],
      success: false
    }

    // find all unique fields for the model
    const uniqueFields = Object.values(model.attributes)
      .filter(attribute => attribute.unique || attribute.primaryKey)
      .map(attribute => attribute.fieldName)

    const t = await api.sequelize.sequelize.transaction()
    await Promise.all(input.data.map(async (params, rowIndex) => {
      try {
        result.totalRows++

        // prepare the query
        const queryParams = uniqueFields
          .filter(field => params[field])
          .map(field => {
            return {[field]: params[field]}
          })

        const records = await model.findAll({
          transaction: t,
          limit: 2,
          where: {
            [Op.or]: queryParams
          }
        })

        let existing = false
        if (records.length > 1) {
          throw new Error('duplicate records found')
        } else if (records.length === 1) {
          existing = true
        }

        const item = this.applyDefaultValues(input.defaults, params)

        if (existing) {
          if (input.update) {
            await records[0].update(item, {transaction: t})
            result.updates++
          } else {
            result.ignored++
          }
        } else {
          if (input.create) {
            await model.create(item, {transaction: t})
            result.inserts++
          } else {
            result.ignored++
          }
        }
      } catch (e) {
        result.errors++
        result.errorDetails.push({row: rowIndex + 1, error: e})
      }
    }))

    if (input.failOnError) {
      if (result.errors) {
        result.inserts = 0
        result.updates = 0
        result.ignored = input.data.length - result.errors
        await t.rollback()
      } else {
        await t.commit()
      }
    } else {
      if (input.dryRun) {
        await t.rollback()
      } else {
        await t.commit()
      }
    }

    result.success = input.failOnError ? result.errors === 0 : true
    return result
  }

  applyDefaultValues (defaultValues, params) {
    const res = Object.assign({}, params)

    if (defaultValues) {
      Object.keys(defaultValues)
        .filter(key => typeof params[key] === 'undefined' || params[key] === '' || params[key] === null)
        .forEach(key => {
          res[key] = defaultValues[key]
        })
    }

    return res
  }

  async parseCSVFile (file) {
    let rows = []
    if (file) {
      rows = await new Promise((resolve, reject) => {
        fs.createReadStream(file.path)
          .pipe(csv({
            separator: ';'
          }))
          .pipe(es.writeArray((error, array) => {
            if (error) reject(error)
            resolve(array)
          }))
      })
    }

    return rows
  }
}
