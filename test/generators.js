const { assign } = Object

exports.generateUser = (opts) => {
  const i = exports.generateUser.index++
  return assign({
    firstName: `First name ${i}`,
    lastName: `Last name ${i}`,
    email: `user${i}@bspb.org`,
    username: `user${i}`,
    password: 'secret'
  }, opts)
}
exports.generateUser.index = 0

exports.generateMember = (opts) => {
  const i = exports.generateMember.index++
  return assign({
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
    phone: (i % 11 === 0) ? `'+359899${i}` : null,
    category: (i % 3 === 0) ? 'student' : ((i % 3 === 1) ? 'regular' : 'retired')
  }, opts)
}
exports.generateMember.index = 0
