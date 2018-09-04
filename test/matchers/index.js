module.exports = {
  toBeFailedAction: require('./toBeActionResult')(false),
  toBeSuccessAction: require('./toBeActionResult')(true),
  toBeDate: require('./toBeDate')
}
