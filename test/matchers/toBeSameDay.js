const { printReceived, printExpected } = require('jest-matcher-utils')
const isSameDay = require('date-fns/is_same_day')
const isValid = require('date-fns/is_valid')

module.exports = function toBeSameDay (received, expected) {
  if (received == null || !isValid(received)) {
    throw new Error(`expected a valid date but got ${JSON.stringify(received)}`)
  }
  let pass = isSameDay(expected, received)
  return pass ? {
    pass,
    message: () => `expected ${printReceived(received)} not to be same day ${printExpected(expected)}`
  } : {
    pass,
    message: () => `expected ${printReceived(received)} to be same day ${printExpected(expected)}`
  }
}
