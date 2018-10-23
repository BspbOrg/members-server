module.exports = [
  {
    model: 'payment',
    data: {
      paymentDate: new Date(Date.UTC(2015, 2, 20, 2, 22, 22, 222)),
      amount: 15,
      billingMemberId: 2,
      members: [1, 2],
      membershipType: 'family'
    }
  },
  {
    model: 'payment',
    data: {
      paymentDate: new Date(Date.UTC(2015, 2, 20, 2, 22, 22, 222)),
      amount: 10,
      billingMemberId: 1,
      membershipType: 'single'
    }
  }
]
