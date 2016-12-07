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
