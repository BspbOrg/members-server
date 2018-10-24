// eslint-disable-next-line no-unused-vars
/* globals describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const SortingProcessor = require('../../classes/SortingProcessor')

describe('sorting processor', () => {
  const sortingProcessor = new SortingProcessor()
  const defaultValue = { columns: ['id'], ascending: true }

  test('should use default value if no sorting columns passed', () => {
    expect(sortingProcessor.generateSortingQuery({ defaultValue })).toEqual([['id', 'ASC']])
  })

  test('should use sorting columns if passed as params', () => {
    const columns = ['firstName', 'lastName']
    const generatedSorting = sortingProcessor.generateSortingQuery({ columns, defaultValue })
    expect(generatedSorting).toEqual(columns.map(c => ([c, expect.anything()])))
  })

  test('should use asc param if passed', () => {
    const columns = ['id']
    const ascending = false
    const generatedSorting = sortingProcessor.generateSortingQuery({ columns, ascending, defaultValue })
    expect(generatedSorting[0]).toEqual([expect.anything(), 'DESC'])
  })

  test('should return empty sorting array if no columns and default value passed', () => {
    expect(sortingProcessor.generateSortingQuery({})).toEqual([])
  })

  test('should return empty sorting array if no params passed', () => {
    expect(sortingProcessor.generateSortingQuery({})).toEqual([])
  })
})
