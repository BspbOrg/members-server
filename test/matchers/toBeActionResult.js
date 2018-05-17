const { printReceived, printExpected } = require('jest-matcher-utils')

module.exports = function toBeActionResult (expected) {
  return function (received) {
    if (!received) {
      throw new Error(`expected ${printReceived(received)} to be action response`)
    }
    let pass = !received.error && (received.success || received.data)
    if (!pass && received.data) {
      throw new Error(`expected ${printReceived(received)} not to have property ${printExpected('data: Any')}`)
    }
    if (!pass && received.success) {
      throw new Error(`expected ${printReceived(received)} not to have property ${printExpected('success: true')}`)
    }
    if (expected) {
      return {
        pass: !!pass,
        message: () => `expected ${printReceived(received)} to match ${printExpected('{ error: undefined, success: true, data: Any }')}`
      }
    } else {
      return {
        pass: !pass,
        message: () => `expected ${printReceived(received)} to match ${printExpected('{ error: String, success: false, data: undefined }')}`
      }
    }
  }
}
