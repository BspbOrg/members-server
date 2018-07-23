/* globals expect, jest */

expect.extend(require('./matchers'))

// set jest timeout to 30s
jest.setTimeout(30000)
