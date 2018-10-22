// eslint-disable-next-line no-unused-vars
/* globals describe, beforeAll, afterAll, beforeEach, afterEach, test, expect */
'use strict'

const InputFormatter = require('../../classes/InputFormatter')

describe('inputFormatter', () => {
  describe('format string to array', () => {
    test('should return array splitted by given separator', () => {
      const input = 'value1+value2'
      const separator = '+'
      const formatted = InputFormatter.formatStringToArray({ input, separator })
      expect(formatted.length).toBe(2)
      expect(formatted).toEqual(expect.arrayContaining(['value1', 'value2']))
    })

    test('should use given separator', () => {
      const input = 'value+1_value+2'
      const separator = '_'
      const formatted = InputFormatter.formatStringToArray({ input, separator })
      expect(formatted.length).toBe(2)
      expect(formatted).toEqual(expect.arrayContaining(['value+1', 'value+2']))
    })

    test('should use default separator', () => {
      const input = 'value1+value2'
      const formatted = InputFormatter.formatStringToArray({ input })
      expect(formatted).toEqual(expect.arrayContaining(['value1', 'value2']))
    })

    test('should return empty array if input is empty', () => {
      expect(InputFormatter.formatStringToArray({ input: '', separator: '+' })).toEqual([])
    })

    test('should return empty array if input is undefined', () => {
      expect(InputFormatter.formatStringToArray({ input: undefined, separator: '+' })).toEqual([])
    })

    test('should return empty array if input is null', () => {
      expect(InputFormatter.formatStringToArray({ input: null, separator: '+' })).toEqual([])
    })

    test('should return empty array if input is missing', () => {
      expect(InputFormatter.formatStringToArray({ separator: '+' })).toEqual([])
    })
  })
})
