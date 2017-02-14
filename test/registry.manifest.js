'use strict'

var npmlog = require('npmlog')
var test = require('tap').test
var tnock = require('./util/tnock')

var Manifest = require('../lib/finalize-manifest').Manifest
var manifest = require('../manifest')

var BASE = {
  name: 'foo',
  version: '1.2.3',
  _hasShrinkwrap: false,
  _shasum: 'deadbeef',
  _resolved: 'https://foo.bar/x.tgz',
  dist: {
    shasum: 'deadbeef',
    tarball: 'https://foo.bar/x.tgz'
  }
}

var META = {
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
      version: '2.0.4'
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
var PKG = new Manifest(BASE)

npmlog.level = process.env.LOGLEVEL || 'silent'
var OPTS = {
  registry: 'https://mock.reg',
  log: npmlog,
  retry: {
    retries: 1,
    factor: 1,
    minTimeout: 1,
    maxTimeout: 10
  }
}

test('fetches version from registry', function (t) {
  var srv = tnock(t, OPTS.registry)

  srv.get('/foo').reply(200, META)
  manifest('foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got manifest from version')
    t.end()
  })
})

test('fetchest tag from registry', function (t) {
  var srv = tnock(t, OPTS.registry)

  srv.get('/foo').reply(200, META)
  manifest('foo@latest', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got manifest from tag')
    t.end()
  })
})

test('fetches version from scoped registry', function (t) {
  var srv = tnock(t, OPTS.registry)

  srv.get('/@usr%2ffoo').reply(200, META)
  manifest('@usr/foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got scoped manifest from version')
    t.end()
  })
})

test('fetches tag from scoped registry', function (t) {
  var srv = tnock(t, OPTS.registry)

  srv.get('/@usr%2ffoo').reply(200, META)
  manifest('@usr/foo@latest', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got scoped manifest from tag')
    t.end()
  })
})

test('fetches manifest from registry by range', function (t) {
  var srv = tnock(t, OPTS.registry)

  srv.get('/foo').reply(200, META)
  manifest('foo@^1.2.0', OPTS, function (err, pkg) {
    if (err) { throw err }
    // Not 1.2.4 because 1.2.3 is `latest`
    t.deepEqual(pkg, new Manifest(META.versions['1.2.3']), 'picked right manifest')
    t.end()
  })
})

test('fetches manifest from scoped registry by range', function (t) {
  var srv = tnock(t, OPTS.registry)

  srv.get('/@usr%2ffoo').reply(200, META)
  manifest('@usr/foo@^1.2.0', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, new Manifest(META.versions['1.2.3']), 'got scoped manifest from version')
    t.end()
  })
})

test('sends auth token if passed in opts', function (t) {
  var TOKEN = 'deadbeef'
  var opts = {
    log: OPTS.log,
    registry: OPTS.registry,
    auth: {
      '//mock.reg/': {
        token: TOKEN
      }
    }
  }

  var srv = tnock(t, OPTS.registry)
  srv.get(
    '/foo'
  ).matchHeader(
    'authorization', 'Bearer ' + TOKEN
  ).reply(200, META)
  manifest('foo@1.2.3', opts, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got manifest from version')
    t.end()
  })
})

test('treats options as optional', function (t) {
  var srv = tnock(t, 'https://registry.npmjs.org')

  srv.get('/foo').reply(200, META)
  manifest('foo@1.2.3', function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'used default options')
    t.end()
  })
})

test('uses scope from spec for registry lookup', function (t) {
  var opts = {
    '@myscope:registry': OPTS.registry,
    // package scope takes priority
    scope: '@otherscope'
  }
  var srv = tnock(t, OPTS.registry)
  srv.get('/@myscope%2ffoo').reply(200, META)
  manifest('@myscope/foo@1.2.3', opts, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'used scope to pick registry')
    t.end()
  })
})

test('uses scope opt for registry lookup', function (t) {
  t.plan(2)
  var srv = tnock(t, OPTS.registry)

  srv.get('/foo').reply(200, META)
  manifest('foo@1.2.3', {
    '@myscope:registry': OPTS.registry,
    scope: '@myscope',
    // scope option takes priority
    registry: 'nope'
  }, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'used scope to pick registry')
  })

  srv.get('/bar').reply(200, META)
  manifest('bar@latest', {
    '@myscope:registry': OPTS.registry,
    scope: 'myscope' // @ auto-inserted
  }, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'scope @ was auto-inserted')
  })
})

test('defaults to registry.npmjs.org if no option given', function (t) {
  var srv = tnock(t, 'https://registry.npmjs.org')

  srv.get('/foo').reply(200, META)
  manifest('foo@1.2.3', { registry: undefined }, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'used npm registry')
    t.end()
  })
})

test('supports scoped auth', function (t) {
  var TOKEN = 'deadbeef'
  var opts = {
    scope: 'myscope',
    '@myscope:registry': OPTS.registry,
    auth: {
      '//mock.reg/': {
        token: TOKEN
      }
    }
  }
  var srv = tnock(t, OPTS.registry)
  srv.get(
    '/foo'
  ).matchHeader(
    'authorization', 'Bearer ' + TOKEN
  ).reply(200, META)
  manifest('foo@1.2.3', opts, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'used scope to pick registry and auth')
    t.end()
  })
})

test('package requests are case-sensitive', function (t) {
  t.plan(2)
  var srv = tnock(t, OPTS.registry)

  var CASEDBASE = {
    name: 'Foo',
    version: '1.2.3',
    _hasShrinkwrap: false,
    _shasum: 'deadbeef',
    _resolved: 'https://foo.bar/x.tgz',
    dist: {
      shasum: 'deadbeef',
      tarball: 'https://foo.bar/x.tgz'
    }
  }
  var CASEDPKG = new Manifest(CASEDBASE)
  srv.get('/Foo').reply(200, {
    versions: {
      '1.2.3': CASEDBASE
    }
  })
  manifest('Foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, CASEDPKG, 'got Cased package')
  })

  srv.get('/foo').reply(200, META)
  manifest('foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got lowercased package')
  })
})

test('handles server-side case-normalization', function (t) {
  t.plan(2)
  var srv = tnock(t, OPTS.registry)

  srv.get('/Cased').reply(200, META)
  manifest('Cased@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got Cased package')
  })

  srv.get('/cased').reply(200, META)
  manifest('cased@latest', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got lowercased package')
  })
})

test('recovers from request errors', function (t) {
  t.plan(4)
  var srv = tnock(t, OPTS.registry)
  var opts = {
    log: OPTS.log,
    registry: OPTS.registry,
    retry: {
      retries: 2,
      minTimeout: 1,
      maxTimeout: 10
    }
  }

  srv.get('/foo').reply(500, function (uri, body) {
    srv.get('/foo').reply(500, function (uri, body) {
      srv.get('/foo').reply(200, function (uri, body) {
        t.ok(true, 'final success')
        return META
      })
      t.ok(true, 'second errored request')
      return body
    })
    t.ok(true, 'first errored request')
    return body
  })

  manifest('foo@1.2.3', opts, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got a manifest')
  })
})
