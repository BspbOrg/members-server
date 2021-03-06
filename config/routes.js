exports['default'] = {
  routes: (api) => {
    return {

      get: [
        { path: '/member', action: 'member:list' },
        { path: '/member.csv', action: 'member:list' },
        { path: '/member.json', action: 'member:list' },
        { path: '/member/:memberId', action: 'member:show' },
        { path: '/me', action: 'user:me' },
        { path: '/payment', action: 'payment:list' },
        { path: '/payment.csv', action: 'payment:list' },
        { path: '/payment/:paymentId', action: 'payment:show' },
        { path: '/user', action: 'user:list' },
        { path: '/user/:userId', action: 'user:show' },
        { path: '/status', action: 'status' }
      ],

      post: [
        { path: '/member', action: 'member:create' },
        { path: '/member/:memberId', action: 'member:update' },
        { path: '/payment', action: 'payment:create' },
        { path: '/payment/:paymentId', action: 'payment:update' },
        { path: '/session', action: 'session:auth' },
        { path: '/user', action: 'user:create' },
        { path: '/user/:userId', action: 'user:update' },
        { path: '/import/member', action: 'import:member' },
        { path: '/import/payment', action: 'import:payment' },
        { path: '/import/family', action: 'import:family' },
        // { path: '/session/:email/resetpw', action: 'user:lost' },
        // { path: '/session/:email/resetpw2', action: 'user:reset' }
        { path: '/sendReminder', action: 'member:sendReminder' }
      ],

      put: [
        // { path: '/session', action: 'session:check' }
      ],

      patch: [
        { path: '/user/:userId', action: 'user:changePassword' }
      ],

      delete: [
        { path: '/member/:memberId', action: 'member:destroy' },
        { path: '/payment/:paymentId', action: 'payment:destroy' },
        { path: '/session', action: 'session:destroy' },
        { path: '/user/:userId', action: 'user:destroy' }
      ]
    }
  }
}
