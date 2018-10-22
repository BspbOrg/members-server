const path = require('path')

exports.default = {
  mailer: (api) => {
    return {
      transport: {
        type: process.env.NODE_ENV === 'test' ? 'nodemailer-mock-transport' : 'nodemailer-mailgun-transport',
        config: {
          auth: {
            api_key: process.env.MAILGUN_API || '97cc8efa2bed2e21bd5d306dff7ce91b-a3d67641-4c78b18a',
            domain: process.env.MAILGUN_DOMAIN || 'sandbox1f0fe78d52b84d7984c690f5c58fa75d.mailgun.org'
          }
        }
      },
      mailOptions: {
        from: process.env.FROM_EMAIL || 'postmaster@sandbox1f0fe78d52b84d7984c690f5c58fa75d.mailgun.org'
      },
      templates: path.join(__dirname, '..', process.env.NODE_ENV === 'test' ? 'test/templates' : 'templates')
    }
  }
}
