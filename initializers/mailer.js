const { Initializer, api } = require('actionhero')
const nodemailer = require('nodemailer')
const Email = require('email-templates')
const Promise = require('bluebird')
const format = require('date-fns/format')
const locale = require('date-fns/locale/bg')

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
    api.mailer.send = async ({ mail, template: templateName, locals }) => {
      const config = api.config.mailer

      if (!(mail && templateName && locals)) {
        return new Error('Invalid options. Must contain template, mail, and locals property')
      }

      const mailOptions = { ...config.mailOptions, ...mail }

      const template = new Email({
        views: {
          root: config.templates,
          options: {
            extension: 'ejs'
          }
        }
      })
      const emailHtml = await template.render(templateName, {
        formatDate: date => format(date, 'Do MMMM YYYY', { locale }),
        ...locals
      })
      mailOptions.html = emailHtml

      api.log('Sending mail', 'debug', this.name)
      return api.mailer.transport.sendMail(mailOptions)
    }
    api.log('I initialized', 'debug', this.name)
  }

  async start () {
    const config = api.config.mailer
    api.log('Creating mail transport ' + config.transport.type, 'debug', this.name)
    api.mailer.transport = nodemailer.createTransport(Promise.promisifyAll(require(config.transport.type)(config.transport.config)))
  }

  async stop () {
    api.log('I stopped', 'debug', this.name)
  }
}
