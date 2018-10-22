// eslint-disable-next-line no-unused-vars
/* globals describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const SortingProcessor = require('../../classes/SortingProcessor')

describe('sorting processor', () => {
  const sortingProcessor = new SortingProcessor()
  const defaultValue = [['id', 'ASC']]

  test('should use default value if no sorting columns passed', () => {
    expect(sortingProcessor.generateSortingQuery({ defaultValue })).toEqual(defaultValue)
  })

  test('should use sorting columns if passed as params', () => {
    const sortingColumns = ['firstName', 'lastName']
    const generatedSorting = sortingProcessor.generateSortingQuery({ sortingColumns, defaultValue })
    expect(generatedSorting.length).toBe(2)
    expect(generatedSorting[0]).toEqual(expect.arrayContaining(['firstName']))
    expect(generatedSorting[1]).toEqual(expect.arrayContaining(['lastName']))
  })

  test('should use asc param if passed', () => {
    const sortingColumns = ['id']
    const asc = false
    const generatedSorting = sortingProcessor.generateSortingQuery({ sortingColumns, asc, defaultValue })
    expect(generatedSorting[0]).toEqual(expect.arrayContaining(['DESC']))
  })

  test('should return empty sorting array if no columns and default value passed', () => {
    expect(sortingProcessor.generateSortingQuery({})).toEqual([])
  })
})
