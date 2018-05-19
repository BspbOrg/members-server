const { assign } = Object
let index = 0

exports.generateUser = (opts) => {
  const i = index++
  return assign({
    firstName: `First name ${i}`,
    lastName: `Last name ${i}`,
    email: `user${i}@bspb.org`,
    username: `user${i}`,
    password: 'secret'
  }, opts)
}
