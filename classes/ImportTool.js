const { api } = require('actionhero')
const { Sequelize } = require('sequelize')
const Op = Sequelize.Op
const csv = require('csv-parser')
const fs = require('fs')
const es = require('event-stream')

module.exports = class ImportTool {
  async import (model, input, {
    preprocessor, preprocessorArgs = [],
    postprocessor, postprocessorArgs = []
  } = {}) {
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

    // prepare all unique index fields
    const uniqueIndexes = [
      model.primaryKeyAttributes,
      ...Object.values(model.uniqueKeys).map(key => key.fields)
    ]
    uniqueIndexes.push()

    const t = await api.sequelize.sequelize.transaction()

    try {
      await input.data.reduce(async (p, params, rowIndex) => {
        try {
          try {
            await p
          } catch (e) {}

          if (t.finished) {
            throw new Error(`Transaction finished with: ${t.finished}`)
          }

          result.totalRows++

          // clone non empty fields of the input
          let row = Object
            .keys(params)
            .filter(key => params[key] !== '')
            .reduce((agg, key) => ({ ...agg, [key]: params[key] }), {})

          // Check that some keys has data
          if (!Object.keys(row).some(key => row[key])) {
            result.ignored++
            return
          }

          row = this.applyDefaultValues(input.defaults, row)
          row = await this.applyRelations(model, row, t)

          if (typeof preprocessor === 'function') {
            row = await preprocessor(row, ...preprocessorArgs)
          }

          let rowModel = await model.build(row)

          // leave only indexes with at least one provided field
          const providedUniqueIndexes = uniqueIndexes.filter(fields => fields.some(fieldName => fieldName in row))
          // check for fully specified indexes
          providedUniqueIndexes.forEach(fields => fields.forEach(fieldName => {
            if (!(fieldName in row)) {
              throw new Error(`Missing ${fieldName} of composite identifier ${JSON.stringify(fields)}`)
            }
          }))

          // prepare query to look for records matching any of the provided unique indexes
          const queryParams = providedUniqueIndexes
            .map(fields => {
              if (fields.length > 1) {
                return {
                  [Op.and]: fields.map(fieldName => ({ [fieldName]: rowModel[fieldName] }))
                }
              }
              return { [fields[0]]: rowModel[fields[0]] }
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
            const record1 = uniqueIndexes
              .reduce((agg, index) => ({
                ...agg,
                ...index
                  .filter(key => records[0][key])
                  .reduce((agg, key) => ({
                    ...agg,
                    [key]: records[0][key]
                  }), {})
              }), {})
            const record2 = uniqueIndexes
              .reduce((agg, index) => ({
                ...agg,
                ...index
                  .filter(key => records[1][key])
                  .reduce((agg, key) => ({
                    ...agg,
                    [key]: records[1][key]
                  }), {})
              }), {})
            throw new Error(`Conflicting records found: ${JSON.stringify(record1)} and ${JSON.stringify(record2)}`)
          } else if (records.length === 1) {
            existing = true
          }

          if (existing) {
            if (input.update) {
              await records[0].update(row, { transaction: t })
              result.updates++
            } else {
              result.ignored++
            }
          } else {
            if (input.create) {
              await model.create(row, { transaction: t })
              result.inserts++
            } else {
              result.ignored++
            }
          }

          if (typeof postprocessor === 'function') {
            postprocessor(model, existing, ...postprocessorArgs)
          }
        } catch (e) {
          result.errors++
          result.errorDetails.push({
            // rowIndex is zero-based and counts from second row (first is header)
            row: rowIndex + 2,
            error: e.message
          })
        }
      }, null)

      if (result.errors) {
        if (input.failOnError) {
          result.inserts = 0
          result.updates = 0
          result.ignored = input.data.length - result.errors
        }
      }

      if (input.dryRun) {
        await t.rollback()
      } else {
        if (input.failOnError && result.errors) {
          await t.rollback()
        } else {
          await t.commit()
        }
      }
    } catch (e) {
      await t.rollback()
    }

    result.success = input.failOnError ? result.errors === 0 : true
    return result
  }

  applyDefaultValues (defaultValues, params) {
    if (!defaultValues) return params

    return {
      ...params,
      ...Object
        .keys(defaultValues)
        .filter(key => typeof params[key] === 'undefined' || params[key] === '' || params[key] === null)
        .reduce((agg, key) => ({ ...agg, [key]: defaultValues[key] }), {})
    }
  }

  async applyRelations (model, row, transaction) {
    const res = { ...row }

    await Promise.all(Object.keys(res)
      .filter(key => key.includes('.'))
      .map(async key => {
        const [relationshipName, relationshipField] = key.split('.')

        if (!model.associations[relationshipName]) {
          throw new Error(`non existing relationship: ${relationshipName}`)
        }

        const relationshipResult = await model.associations[relationshipName].target.findAll({
          transaction: transaction,
          limit: 2,
          where: {
            [relationshipField]: res[key]
          }
        })

        if (relationshipResult.length === 1) {
          res[model.associations[relationshipName].identifier] = relationshipResult[0].id
        } else if (relationshipResult.length === 0) {
          throw new Error(`${relationshipName} relation not found`)
        } else {
          throw new Error(`found more than one ${relationshipName} relation`)
        }
      }))

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
