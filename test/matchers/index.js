module.exports = {
  toBeFailedAction: require('./toBeActionResult')(false),
  toBeSuccessAction: require('./toBeActionResult')(true)
}
