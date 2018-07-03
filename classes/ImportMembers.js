const {api} = require('actionhero')
const {Sequelize} = require('sequelize')
const Op = Sequelize.Op
const defaultAgeCategory = 'regular'

module.exports = class ImportMembers {
  async import (input) {
    const result = {}
    result.errorDetails = []

    let numberOfInserts = 0
    let numberOfErrors = 0
    let numberOfIgnored = 0
    let numberOfUpdates = 0

    const t = await api.sequelize.sequelize.transaction()
    await Promise.all(input.data.map(async (memberParams, rowIndex) => {
      try {
        // find all unique fields for the model
        const uniqueFields = Object.values(api.models.member.attributes)
          .filter(attribute => attribute.unique || attribute.primaryKey)
          .map(attribute => attribute.fieldName)

        // prepare the query
        const queryParams = uniqueFields
          .filter(field => memberParams[field])
          .map(field => {
            return {[field]: memberParams[field]}
          })

        const records = await api.models.member.findAll({
          transaction: t,
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
          if (input.updateExisting) {
            await records[0].update(this.transformModel(input, memberParams), {transaction: t})
            numberOfUpdates++
          } else {
            numberOfIgnored++
          }
        } else {
          if (input.createNew) {
            await api.models.member.create(this.transformModel(input, memberParams), {transaction: t})
            numberOfInserts++
          } else {
            numberOfIgnored++
          }
        }
      } catch (e) {
        numberOfErrors++
        result.errorDetails.push({row: rowIndex + 1, error: e})
      }
    }))

    if (input.failOnError) {
      if (numberOfErrors) {
        numberOfInserts = 0
        numberOfUpdates = 0
        numberOfIgnored = input.data.length - numberOfErrors
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

    result.totalRows = input.data.length
    result.inserts = numberOfInserts
    result.updates = numberOfUpdates
    result.errors = numberOfErrors
    result.ignored = numberOfIgnored
    result.dryRun = input.dryRun && input.dryRun
    result.success = input.failOnError ? numberOfErrors === 0 : true
    return result
  }

  transformModel (input, params) {
    if (!params.category) {
      if (input.category) {
        return Object.assign({}, params, {category: input.category})
      } else {
        return Object.assign({}, params, {category: defaultAgeCategory})
      }
    }

    return params
  }
}
