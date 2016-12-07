var cacache = require('cacache')
var CACHE = require('./util/test-dir')(__filename)
var cacheKey = require('../lib/util/cache-key')
var npmlog = require('npmlog')
var test = require('tap').test
var tnock = require('./util/tnock')

var manifest = require('../manifest')

var PKG = {
  name: 'foo',
  version: '1.2.3'
}
var SCOPEDPKG = {
  name: '@usr/foo',
  version: '1.2.3'
}

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

test('fetches version or tag from registry', function (t) {
  t.plan(2)
  var srv = tnock(t, OPTS.registry)

  srv.get('/foo/1.2.3').reply(200, PKG)
  manifest('foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got manifest from version')
  })

  srv.get('/foo/latest').reply(200, PKG)
  manifest('foo@latest', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got manifest from tag')
  })
})

test('fetches version or tag from scoped registry', function (t) {
  t.plan(2)
  var srv = tnock(t, OPTS.registry)

  srv.get('/@usr%2ffoo/1.2.3').reply(200, SCOPEDPKG)
  manifest('@usr/foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, SCOPEDPKG, 'got scoped manifest from version')
  })

  srv.get('/@usr%2ffoo/latest').reply(200, SCOPEDPKG)
  manifest('@usr/foo@latest', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, SCOPEDPKG, 'got scoped manifest from tag')
  })
})

test('fetches version or tag from registry', function (t) {
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
    '/foo/1.2.3'
  ).matchHeader(
    'authorization', 'Bearer ' + TOKEN
  ).reply(200, PKG)
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
  var srv = tnock(t, OPTS.registry)
  srv.get('/@myscope%2ffoo/1.2.3').reply(200, PKG)
  manifest('@myscope/foo@1.2.3', opts, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'used scope to pick registry')
    t.end()
  })
})

test('uses scope opt for registry lookup', function (t) {
  t.plan(2)
  var srv = tnock(t, OPTS.registry)

  srv.get('/foo/1.2.3').reply(200, PKG)
  manifest('foo@1.2.3', {
    '@myscope:registry': OPTS.registry,
    scope: '@myscope',
    // scope option takes priority
    registry: 'nope'
  }, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'used scope to pick registry')
  })

  srv.get('/foo/latest').reply(200, PKG)
  manifest('foo@latest', {
    '@myscope:registry': OPTS.registry,
    scope: 'myscope' // @ auto-inserted
  }, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'scope @ was auto-inserted')
  })
})

test('defaults to registry.npmjs.org if no option given', function (t) {
  var srv = tnock(t, 'https://registry.npmjs.org')

  srv.get('/foo/1.2.3').reply(200, PKG)
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
    '/foo/1.2.3'
  ).matchHeader(
    'authorization', 'Bearer ' + TOKEN
  ).reply(200, PKG)
  manifest('foo@1.2.3', opts, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'used scope to pick registry and auth')
    t.end()
  })
})

test('package requests are case-sensitive', function (t) {
  t.plan(2)
  var srv = tnock(t, OPTS.registry)

  var CASEDPKG = {
    name: 'Foo',
    version: '1.2.3'
  }
  srv.get('/Foo/1.2.3').reply(200, CASEDPKG)
  manifest('Foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, CASEDPKG, 'got Cased package')
  })

  srv.get('/foo/1.2.3').reply(200, PKG)
  manifest('foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got lowercased package')
  })
})

test('handles server-side case-normalization', function (t) {
  t.plan(2)
  var srv = tnock(t, OPTS.registry)

  srv.get('/Cased/1.2.3').reply(200, PKG)
  manifest('Cased@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got Cased package')
  })

  srv.get('/cased/latest').reply(200, PKG)
  manifest('cased@latest', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got lowercased package')
  })
})

test('memoizes identical registry requests', function (t) {
  t.plan(2)
  var srv = tnock(t, OPTS.registry)

  srv.get('/foo/1.2.3').once().reply(200, PKG)
  manifest('foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got a manifest')
    manifest('foo@1.2.3', OPTS, function (err, pkg) {
      if (err) { throw err }
      t.deepEqual(pkg, PKG, 'got a manifest')
    })
  })
})

test('inflights concurrent requests', function (t) {
  t.plan(2)
  var srv = tnock(t, OPTS.registry)

  srv.get('/foo/1.2.3').once().reply(200, PKG)
  manifest('foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got a manifest')
  })

  manifest('foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got a manifest')
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

  srv.get('/foo/1.2.3').reply(500, function (uri, body) {
    srv.get('/foo/1.2.3').reply(500, function (uri, body) {
      srv.get('/foo/1.2.3').reply(200, function (uri, body) {
        t.ok(true, 'final success')
        return PKG
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

test('supports fetching from an optional cache', function (t) {
  var opts = {
    registry: OPTS.registry,
    log: OPTS.log,
    retry: OPTS.retry,
    cache: CACHE
  }
  var key = cacheKey('registry', OPTS.registry + '/foo/1.2.3')
  // ugh this API has gotta change
  cacache.put.data(CACHE, key, 'FILENAME', 'test', {
    metadata: PKG
  }, function (err) {
    if (err) { throw err }
    manifest('foo@1.2.3', opts, function (err, pkg) {
      if (err) { throw err }
      t.deepEqual(pkg, PKG)
      t.end()
    })
  })
})

test('falls back to registry if cache entry missing', function (t) {
  var opts = {
    registry: OPTS.registry,
    log: OPTS.log,
    retry: OPTS.retry,
    cache: CACHE
  }
  var srv = tnock(t, opts.registry)
  srv.get('/foo/1.2.3').reply(200, PKG)
  manifest('foo@1.2.3', opts, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG)
    t.end()
  })
})

test('uses proxy settings')
