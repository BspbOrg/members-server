const { Initializer, api } = require('actionhero')
const _ = require('lodash')
const nodemailer = require('nodemailer')
const Email = require('email-templates')
const path = require('path')
const Promise = require('bluebird')

module.exports = class MailerInit extends Initializer {
  constructor () {
    super()
    this.name = 'mailer'
    this.loadPriority = 1000
    this.startPriority = 1000
    this.stopPriority = 1000
  }

  async initialize () {
    api.mailer = {}
    api.mailer.send = async (options) => {
      var config = api.config.mailer

      if (!(options.mail && options.template && options.locals)) {
        return new Error('Invalid options. Must contain template, mail, and locals property')
      }

      options.mail = _.defaults(options.mail, config.mailOptions)

      var templateDir = path.join(config.templates, options.template)

      var template = new Email({
        views: {
          root: templateDir,
          options: {
            extension: 'ejs'
          }
        }
      })
      var emailHtml = await template.render(options.template, options.locals)
      options.mail.html = emailHtml

      api.log('Sending mail', 'debug', this.name)
      return api.mailer.transport.sendMail(options.mail)
    }
    api.log('I initialized', 'debug', this.name)
  }

  async start () {
    var config = api.config.mailer
    api.log('Creating mail transport ' + config.transport.type, 'debug', this.name)
    api.mailer.transport = nodemailer.createTransport(Promise.promisifyAll(require(config.transport.type)(config.transport.config)))
  }

  async stop () {
    api.log('I stopped', 'debug', this.name)
  }
}
