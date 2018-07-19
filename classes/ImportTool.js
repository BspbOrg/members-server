const {api} = require('actionhero')
const {Sequelize} = require('sequelize')
const Op = Sequelize.Op
const csv = require('csv-parser')
const fs = require('fs')
const es = require('event-stream')

module.exports = class ImportTool {
  async import (model, input, preprocess) {
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

    // find all matching fields for the model
    const matchingFields = []
    matchingFields.push(model.primaryKeyAttributes)

    Object.values(model.uniqueKeys)
      .forEach(uniqueKey => {
        matchingFields.push(uniqueKey.fields)
      })

    const t = await api.sequelize.sequelize.transaction()
    await Promise.all(input.data.map(async (params, rowIndex) => {
      try {
        result.totalRows++

        let row = this.applyDefaultValues(input.defaults, params)
        row = await this.applyRelations(model, row, t)
        if (typeof preprocess === 'function') {
          row = await preprocess(row)
        }

        // prepare the query
        const queryParams = matchingFields
          .filter(field => {
            // check only single column indexes here. Multi column indexes are passed to the next check for missing part of the index.
            if (field.length === 1) {
              return field[0] in row
            }
            return true
          })
          .map(field => {
            if (field.length > 1) {
              return {
                [Op.and]: field.map(fieldName => {
                  if (!(fieldName in row)) {
                    throw new Error('missing part of composite identifier')
                  }
                  return {[fieldName]: row[fieldName]}
                })

              }
            } else {
              return {[field[0]]: row[field[0]]}
            }
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

        if (existing) {
          if (input.update) {
            await records[0].update(row, {transaction: t})
            result.updates++
          } else {
            result.ignored++
          }
        } else {
          if (input.create) {
            await model.create(row, {transaction: t})
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

  async applyRelations (model, row, transaction) {
    const res = Object.assign({}, row)

    await Promise.all(Object.keys(res)
      .filter(key => !!key.includes('.'))
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
