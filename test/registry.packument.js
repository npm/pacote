'use strict'

const BB = require('bluebird')

const npmlog = require('npmlog')
const test = require('tap').test
const tnock = require('./util/tnock')

const packument = require('../packument')

const BASE = {
  name: 'foo',
  version: '1.2.3',
  _hasShrinkwrap: false,
  _integrity: 'sha1-deadbeef',
  _shasum: '75e69d6de79f',
  _resolved: 'https://foo.bar/x.tgz',
  dist: {
    integrity: 'sha1-deadbeef',
    shasum: '75e69d6de79f',
    tarball: 'https://foo.bar/x.tgz'
  }
}

const META = {
  _cached: false,
  _contentLength: 0,
  name: 'foo',
  'dist-tags': { latest: '1.2.3', lts: '1.2.1' },
  versions: {
    '0.0.0': {
      name: 'foo',
      version: '0.0.0'
    },
    '1.2.0': {
      name: 'foo',
      version: '1.2.0',
      engines: {
        node: '^1.0.0',
        npm: '^2.0.1'
      }
    },
    '2.0.4': {
      name: 'foo',
      version: '2.0.4',
      _hasShrinkwrap: false,
      _integrity: 'sha1-deadbeef',
      _shasum: '75e69d6de79f',
      _resolved: 'https://foo.bar/x.tgz',
      dist: {
        integrity: 'sha1-deadbeef',
        shasum: '75e69d6de79f',
        tarball: 'https://foo.bar/x.tgz'
      }
    },
    '2.0.5': {
      name: 'foo',
      version: '2.0.5',
      deprecated: 'yes. yes it is.',
      _hasShrinkwrap: false,
      _integrity: 'sha1-deadbeef',
      _shasum: '75e69d6de79f',
      _resolved: 'https://foo.bar/x.tgz',
      dist: {
        integrity: 'sha1-deadbeef',
        shasum: '75e69d6de79f',
        tarball: 'https://foo.bar/x.tgz'
      }
    },
    '1.2.1': {
      name: 'foo',
      version: '1.2.1'
    },
    '1.2.3': BASE,
    '1.2.4': {
      name: 'foo',
      version: '1.2.4'
    },
    '3.4.5': {
      name: 'foo',
      version: '3.4.5'
    }
  }
}

npmlog.level = process.env.LOGLEVEL || 'silent'
const OPTS = {
  registry: 'https://mock.reg',
  log: npmlog,
  retry: {
    retries: 1,
    factor: 1,
    minTimeout: 1,
    maxTimeout: 10
  }
}

test('fetches packument from registry', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/foo').reply(200, META)
  return packument('foo', OPTS).then(meta => {
    t.deepEqual(meta, META, 'got packument')
  })
})

test('fetches packument from scoped registry', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/@usr%2ffoo').reply(200, META)
  return packument('@usr/foo', OPTS).then(meta => {
    t.deepEqual(meta, META, 'got scoped packument')
  })
})

test('fetches corgi by default', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/foo').matchHeader(
    'accept', 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*'
  ).reply(200, META)
  return packument('foo', OPTS).then(meta => {
    t.deepEqual(meta, META, 'got packument')
  })
})

test('falls back to fullfat if corgi fails', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/foo').matchHeader(
    'accept', 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*'
  ).reply(404)
  srv.get('/foo').matchHeader(
    'accept', 'application/json'
  ).reply(200, META)
  return packument('foo', OPTS).then(meta => {
    t.deepEqual(meta, META, 'got packument')
  })
})

test('sends auth token if passed in opts', t => {
  const TOKEN = 'deadbeef'
  const opts = {
    log: OPTS.log,
    registry: OPTS.registry,
    '//mock.reg/:_authToken': TOKEN
  }

  const srv = tnock(t, OPTS.registry)
  srv.get(
    '/foo'
  ).matchHeader(
    'authorization', 'Bearer ' + TOKEN
  ).reply(200, META)
  return packument('foo', opts).then(meta => {
    t.deepEqual(meta, META, 'got packument with auth')
  })
})

test('treats options as optional', t => {
  const srv = tnock(t, 'https://registry.npmjs.org')

  srv.get('/foo').reply(200, META)
  return packument('foo').then(meta => {
    t.deepEqual(meta, META, 'used default options')
  })
})

test('uses scope from spec for registry lookup', t => {
  const opts = {
    '@myscope:registry': OPTS.registry,
    // package scope takes priority
    scope: '@otherscope'
  }
  const srv = tnock(t, OPTS.registry)
  srv.get('/@myscope%2ffoo').reply(200, META)
  return packument('@myscope/foo', opts).then(meta => {
    t.deepEqual(meta, META, 'used scope to pick registry')
  })
})

test('uses scope opt for registry lookup', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/foo').reply(200, META)
  srv.get('/bar').reply(200, META)

  return BB.join(
    packument('foo', {
      '@myscope:registry': OPTS.registry,
      scope: '@myscope',
      // scope option takes priority
      registry: 'nope'
    }).then(meta => {
      t.deepEqual(meta, META, 'used scope to pick registry')
    }),
    packument('bar', {
      '@myscope:registry': OPTS.registry,
      scope: 'myscope' // @ auto-inserted
    }).then(meta => {
      t.deepEqual(meta, META, 'scope @ was auto-inserted')
    })
  )
})

test('defaults to registry.npmjs.org if no option given', t => {
  const srv = tnock(t, 'https://registry.npmjs.org')

  srv.get('/foo').reply(200, META)
  return packument('foo', { registry: undefined }).then(meta => {
    t.deepEqual(meta, META, 'used npm registry')
  })
})

test('supports scoped auth', t => {
  const TOKEN = 'deadbeef'
  const opts = {
    scope: 'myscope',
    '@myscope:registry': OPTS.registry,
    '//mock.reg/:_authToken': TOKEN
  }
  const srv = tnock(t, OPTS.registry)
  srv.get(
    '/foo'
  ).matchHeader(
    'authorization', 'Bearer ' + TOKEN
  ).reply(200, META)
  return packument('foo', opts).then(meta => {
    t.deepEqual(meta, META, 'used scope to pick registry and auth')
  })
})

test('sends auth token if passed in global opts', t => {
  const TOKEN = 'deadbeef'
  const opts = {
    registry: OPTS.registry,
    'always-auth': true,
    token: TOKEN
  }

  const srv = tnock(t, OPTS.registry)
  srv.get(
    '/foo'
  ).matchHeader(
    'authorization', 'Bearer ' + TOKEN
  ).reply(200, META)
  return packument('foo', opts).then(meta => {
    t.deepEqual(meta, META, 'got global auth token')
  })
})

test('sends basic authorization if alwaysAuth and _auth', t => {
  const TOKEN = 'deadbeef'
  const opts = {
    registry: OPTS.registry,
    alwaysAuth: true,
    _auth: TOKEN
  }

  const srv = tnock(t, OPTS.registry)
  srv.get(
    '/foo'
  ).matchHeader(
    'authorization', 'Basic ' + TOKEN
  ).reply(200, META)
  return packument('foo', opts).then(meta => {
    t.deepEqual(meta, META, 'alwaysAuth works')
  })
})
