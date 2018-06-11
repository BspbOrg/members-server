# BSPB Members management

[![Dependency Status](https://david-dm.org/BspbOrg/members-server.svg?style=flat-square)](https://david-dm.org/BspbOrg/members-server)
[![Greenkeeper badge](https://badges.greenkeeper.io/BspbOrg/members-server.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/BspbOrg/members-server.svg?branch=master)](https://travis-ci.org/BspbOrg/members-server)

Management system for [BSPB](http://bspb.org/) members

## To install:
(assuming you have [node](http://nodejs.org/) and NPM installed)

```
npm install
docker-compose up -d db redis dbadmin
npm run migrate
```

## To create user:

```
npm start
npx actionhero console
  --> api.models.user.create ({
        username: "admin",
        firstName: "admin",
        lastName: "admin",
        password: "admin",
        email: "admin@admin.admin",
        role: "admin"
        })
```
## To Run:

```
docker-compose start db redis dbadmin
npm start
```

## To Test:
`npm test`

## License

[AGPL-v3.0](LICENSE)

Copyright (c) 2018 [Bulgarian Society for the Protection of Birds](http://bspb.org)
