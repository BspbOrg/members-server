const {printReceived, printExpected} = require('jest-matcher-utils')
const compareAsc = require('date-fns/compare_asc')

module.exports = function toBeDate (received, expected) {
  let pass = compareAsc(expected, received) === 0
  return {
    pass: !!pass,
    message: () => `expected ${printReceived(received)} to match ${printExpected(expected)}`
  }
}
