const { printReceived, printExpected } = require('jest-matcher-utils')
const isSameDay = require('date-fns/is_same_day')

module.exports = function toBeSameDay (received, expected) {
  let pass = isSameDay(expected, received)
  return {
    pass: !!pass,
    message: () => `expected ${printReceived(received)} to be same day ${printExpected(expected)}`
  }
}
