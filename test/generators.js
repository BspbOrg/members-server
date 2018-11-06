const addDays = require('date-fns/add_days')
const format = require('date-fns/format')
exports.generateUser = (opts) => {
  const i = exports.generateUser.index++
  return {
    firstName: `First name ${i}`,
    lastName: `Last name ${i}`,
    email: `user${i}@bspb.org`,
    username: `user${i}`,
    password: 'secret',
    ...opts
  }
}
exports.generateUser.index = 0

exports.generateMember = (opts) => {
  const i = exports.generateMember.index++
  return {
    firstName: `First name ${i}`,
    middleName: `Middle name ${i}`,
    lastName: `Last name ${i}`,
    email: (i % 2 === 0) ? `member${i}@bspb.org` : null,
    username: (i % 5 === 0) ? `member${i}` : null,
    accessId: (i % 7 !== 0) ? `${i}` : null,
    cardId: `${i}`,
    country: `Country ${i}`,
    city: `City ${i}`,
    postalCode: `Postal code ${i}`,
    address: `Address ${i}`,
    phone: (i % 11 === 0) ? `+35989911122${i % 9 + 1}` : null,
    category: (i % 3 === 0) ? 'student' : ((i % 3 === 1) ? 'regular' : 'retired'),
    membershipStartDate: format(addDays('2015-05-10', i + 1), 'YYYY-MM-DD'),
    notes: 'notes ' + i,
    ...opts
  }
}
exports.generateMember.index = 0

exports.generatePayment = (overrideParams = {}, { addMembers = false } = {}) => {
  const i = exports.generatePayment.index++
  return {
    paymentDate: format(addDays('2017-05-10', i + 1), 'YYYY-MM-DD'),
    paymentType: `cash${i}`,
    amount: 1 + i,
    membershipType: (i % 2 === 0) ? `single` : 'family',
    billingMemberId: (i % 2) + 1,
    info: 'info ' + i,
    notes: 'notes ' + i,
    ...(addMembers ? { members: [((i + 1) % 2) + 1] } : {}),
    ...overrideParams
  }
}

exports.generatePayment.index = 0
