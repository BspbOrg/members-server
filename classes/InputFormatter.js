module.exports = class InputFormatter {
  static formatStringToArray ({ input, separator = '+' } = {}) {
    return input ? input.split(separator) : []
  }
}
