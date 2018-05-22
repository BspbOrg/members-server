exports[ 'default' ] = {
  routes: (api) => {
    return {

      get: [
        { path: '/member', action: 'member:list' },
        { path: '/member/:memberId', action: 'member:show' },
        { path: '/me', action: 'user:me' },
        { path: '/user', action: 'user:list' },
        { path: '/user/:userId', action: 'user:show' },
        { path: '/status', action: 'status' }
      ],

      post: [
        { path: '/member', action: 'member:create' },
        { path: '/member/:memberId', action: 'member:update' },
        { path: '/session', action: 'session:auth' },
        { path: '/user', action: 'user:create' },
        { path: '/user/:userId', action: 'user:update' }
        // { path: '/session/:email/resetpw', action: 'user:lost' },
        // { path: '/session/:email/resetpw2', action: 'user:reset' }
      ],

      put: [
        // { path: '/session', action: 'session:check' }
      ],

      patch: [
        { path: '/user/:userId', action: 'user:changePassword' }
      ],

      delete: [
        { path: '/member/:memberId', action: 'member:destroy' },
        { path: '/session', action: 'session:destroy' },
        { path: '/user/:userId', action: 'user:destroy' }
      ]
    }
  }
}
