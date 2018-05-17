exports[ 'default' ] = {
  routes: (api) => {
    return {

      get: [
        { path: '/user', action: 'user:list' },
        { path: '/me', action: 'user:me' },
        { path: '/user/:id', action: 'user:show' },
        { path: '/status', action: 'status' }
      ],

      post: [
        { path: '/session', action: 'session:auth' },
        { path: '/user', action: 'user:create' },
        { path: '/user/:id', action: 'user:edit' }
        // { path: '/session/:email/resetpw', action: 'user:lost' },
        // { path: '/session/:email/resetpw2', action: 'user:reset' }
      ],

      put: [
        // { path: '/session', action: 'session:check' }
      ],

      patch: [
        { path: '/user/:id', action: 'user:changePassword' }
      ],

      delete: [
        { path: '/session', action: 'session:destroy' },
        { path: '/user/:id', action: 'user:destroy' }
      ]
    }
  }
}
