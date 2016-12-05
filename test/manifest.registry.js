var silentlog = require('./util/silentlog')
var test = require('tap').test
var nock = require('nock')

var manifest = require('../manifest')

var PKG = {
  name: 'foo',
  version: '1.2.3'
}
var SCOPEDPKG = {
  name: '@usr/foo',
  version: '1.2.3'
}

var OPTS = {
  log: silentlog,
  registry: 'https://mock.reg'
}

var server
test('setup', function (t) {
  server = nock(OPTS.registry)
  t.end()
})

test('fetches version or tag from registry', function (t) {
  t.plan(2)

  server.get('/foo/1.2.3').once().reply(200, PKG)
  manifest('foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got manifest from version')
  })

  server.get('/foo/latest').once().reply(200, PKG)
  manifest('foo@latest', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got manifest from tag')
  })
})

test('fetches version or tag from scoped registry', function (t) {
  t.plan(2)

  server.get('/@usr%2ffoo/1.2.3').once().reply(200, SCOPEDPKG)
  manifest('@usr/foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, SCOPEDPKG, 'got scoped manifest from version')
  })

  server.get('/@usr%2ffoo/latest').once().reply(200, SCOPEDPKG)
  manifest('@usr/foo@latest', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, SCOPEDPKG, 'got scoped manifest from tag')
  })
})

test('fetches version or tag from registry', function (t) {
  var TOKEN = 'deadbeef'
  var opts = {
    registry: OPTS.registry,
    auth: {
      '//mock.reg/': {
        token: TOKEN
      }
    }
  }
  server.get(
    '/foo/1.2.3'
  ).matchHeader(
    'authorization', 'Bearer ' + TOKEN
  ).once().reply(200, PKG)
  manifest('foo@1.2.3', opts, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got manifest from version')
    t.end()
  })
})

test('uses scope from spec for registry lookup', function (t) {
  var opts = {
    '@myscope:registry': OPTS.registry,
    // package scope takes priority
    scope: '@otherscope'
  }
  server.get('/@myscope%2ffoo/1.2.3').once().reply(200, PKG)
  manifest('@myscope/foo@1.2.3', opts, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'used scope to pick registry')
    t.end()
  })
})

test('uses scope opt for registry lookup', function (t) {
  t.plan(2)

  server.get('/foo/1.2.3').once().reply(200, PKG)

  manifest('foo@1.2.3', {
    '@myscope:registry': OPTS.registry,
    scope: '@myscope',
    // scope option takes priority
    registry: 'nope'
  }, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'used scope to pick registry')
  })

  manifest('foo@1.2.3', {
    '@myscope:registry': OPTS.registry,
    scope: 'myscope' // @ auto-inserted
  }, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'scope @ was auto-inserted')
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
  server.get(
    '/foo/1.2.3'
  ).matchHeader(
    'authorization', 'Bearer ' + TOKEN
  ).once().reply(200, PKG)
  manifest('foo@1.2.3', opts, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'used scope to pick registry and auth')
    t.end()
  })
})

test('supports fetching from an optional cache')
test('uses proxy settings')
test('recovers from request errors')
