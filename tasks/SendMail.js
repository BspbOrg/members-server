const { api, Task } = require('actionhero')

module.exports = class SendMail extends Task {
  constructor () {
    super()
    this.name = 'sendmail'
    this.description = 'Sends email'
    this.frequency = 0
    this.queue = '*'
    this.middleware = []
  }

  async run (data) {
    return api.mailer.send(data)
  }
}
