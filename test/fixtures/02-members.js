module.exports = [
  {
    model: 'member',
    data: {
      firstName: 'Completely',
      middleName: 'Populated',
      lastName: 'Member',
      username: 'member',
      email: 'member@bspb.org',
      membershipExpire: new Date(9999, 11, 30, 23, 59, 59, 999),
      originalSource: 'fixtures',
      accessId: '543210',
      cardId: '12345',
      country: 'Bulgaria',
      city: 'Plovdiv',
      postalCode: '4000',
      address: 'Central square #1',
      phone: '+35989000',
      category: 'regular'
    }
  },
  {
    model: 'member',
    data: {
      firstName: 'Minimal',
      lastName: 'Member'
    }
  }
]
