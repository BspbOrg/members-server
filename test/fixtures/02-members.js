const addDays = require('date-fns/add_days')
const subDays = require('date-fns/sub_days')

module.exports = [
  {
    model: 'member',
    data: {
      firstName: 'Completely',
      middleName: 'Populated',
      lastName: 'Member',
      username: 'member',
      email: 'member@bspb.org',
      membershipEndDate: '9999-12-31',
      originalSource: 'fixtures',
      accessId: '543210',
      cardId: '12345',
      country: 'Bulgaria',
      city: 'Plovdiv',
      postalCode: '4000',
      address: 'Central square #1',
      phone: '+359890111222',
      category: 'regular',
      membershipStartDate: '2018-06-06'
    }
  },
  {
    model: 'member',
    data: {
      firstName: 'Minimal',
      lastName: 'Member'
    }
  },
  {
    model: 'member',
    data: {
      firstName: 'Completely1',
      middleName: 'Populated',
      lastName: 'Member1',
      username: 'member123',
      email: 'member123@bspb.org',
      membershipEndDate: addDays(new Date(), 32).toISOString(),
      originalSource: 'fixtures',
      accessId: '543211',
      cardId: '12346',
      country: 'Bulgaria',
      city: 'Plovdiv',
      postalCode: '4000',
      address: 'Central square #1',
      phone: '+359890111221',
      category: 'regular',
      membershipStartDate: '2018-06-06'
    }
  },
  {
    model: 'member',
    data: {
      firstName: 'Completely2',
      middleName: 'Populated',
      lastName: 'Member2',
      username: 'member1234',
      email: 'member1234@bspb.org',
      membershipEndDate: addDays(new Date(), 28).toISOString(),
      originalSource: 'fixtures',
      accessId: '543212',
      cardId: '12347',
      country: 'Bulgaria',
      city: 'Plovdiv',
      postalCode: '4000',
      address: 'Central square #1',
      phone: '+359890111223',
      category: 'regular',
      membershipStartDate: '2018-06-06'
    }
  },
  {
    model: 'member',
    data: {
      firstName: 'Completely3',
      middleName: 'Populated',
      lastName: 'Member3',
      username: 'member12345',
      email: 'member12345@bspb.org',
      membershipEndDate: addDays(new Date(), 28).toISOString(),
      originalSource: 'fixtures',
      accessId: '543213',
      cardId: '12349',
      country: 'Bulgaria',
      city: 'Plovdiv',
      postalCode: '4000',
      address: 'Central square #1',
      phone: '+359890111224',
      category: 'regular',
      membershipStartDate: '2018-06-06'
    }
  },
  {
    model: 'member',
    data: {
      firstName: 'Completely4',
      middleName: 'Populated',
      lastName: 'Member4',
      username: 'member123456',
      email: 'member123456@bspb.org',
      membershipEndDate: addDays(new Date(), 28).toISOString(),
      originalSource: 'fixtures',
      accessId: '543214',
      cardId: '12341',
      country: 'Bulgaria',
      city: 'Plovdiv',
      postalCode: '4000',
      address: 'Central square #1',
      phone: '+359890111225',
      category: 'regular',
      membershipStartDate: '2018-06-06'
    }
  },
  {
    model: 'member',
    data: {
      firstName: 'Completely5',
      middleName: 'Populated',
      lastName: 'Member5',
      username: 'member1234567',
      email: 'member1234567@bspb.org',
      membershipEndDate: subDays(new Date(), 1).toISOString(),
      originalSource: 'fixtures',
      accessId: '543215',
      cardId: '12331',
      country: 'Bulgaria',
      city: 'Plovdiv',
      postalCode: '4000',
      address: 'Central square #1',
      phone: '+359890111226',
      category: 'regular',
      membershipStartDate: '2018-06-06'
    }
  }
]
