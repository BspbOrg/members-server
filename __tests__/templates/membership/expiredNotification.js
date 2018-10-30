// eslint-disable-next-line no-unused-vars
/* global describe, test, expect, jest, beforeEach, beforeAll, afterEach, afterAll */

const mailerConfig = require('../../../config/mailer').default.mailer()
const { generateMember } = require('../../../test/generators')
const Email = require('email-templates')
const format = require('date-fns/format')
const locale = require('date-fns/locale/bg')
const fs = require('fs')

const render = async ({ mail, member, locals } = {}) => {
  const options = {
    mail: {
      to: 'to@example.com',
      subject: 'Subject',
      ...mail
    },
    template: 'membership/expiredNotification',
    locals: {
      ...generateMember({
        membershipEndDate: new Date(2018, 10, 1),
        ...member
      }),
      memberId: 12345,
      formatDate: date => format(date, 'Do MMMM YYYY', { locale }),
      ...locals
    }
  }
  const template = new Email({
    views: {
      root: mailerConfig.templates,
      options: {
        extension: 'ejs'
      }
    }
  })
  const view = await template.render(options.template, options.locals)
  return { view, options }
}

describe('template: expiredNotification', () => {
  test('renders for registered', async () => {
    const { view } = await render({ member: { username: 'username' } })
    expect(view).toMatchSnapshot()
    fs.writeFileSync('expiredNotification-registered.html', view)
  })

  test('renders for unregistered', async () => {
    const { view } = await render({ member: { username: null } })
    expect(view).toMatchSnapshot()
    fs.writeFileSync('expiredNotification-unregistered.html', view)
  })
})
