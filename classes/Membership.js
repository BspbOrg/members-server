const addYears = require('date-fns/add_years')
const isAfter = require('date-fns/is_after')
const compareAsc = require('date-fns/compare_asc')

module.exports = class Membership {
  constructor ({ api }) {
    this.api = api
  }

  /**
   *
   * @param {Payment[]}payments
   */
  computeMembership (payments) {
    let startDate
    let endDate
    payments = payments.sort(({ paymentDate: a }, { paymentDate: b }) => compareAsc(a, b))
    for (let payment of payments) {
      if (!endDate || isAfter(payment.paymentDate, endDate)) {
        // membership expired or we started new one
        startDate = payment.paymentDate
        endDate = addYears(startDate, 1 /* year */)
      } else {
        // we have payment before membership has expired
        endDate = addYears(endDate, 1 /* year */)
      }
    }
    return { startDate, endDate }
  }

  async enqueueRecompute (members) {
    return Promise.all(
      members.map(
        member => this.api.tasks.enqueue(
          'membership:recompute',
          { memberId: member.id || member }
        )
      )
    )
  }
}
