'use strict'

const BB = require('bluebird')

const cache = require('../lib/cache')
const npmlog = require('npmlog')
const test = require('tap').test
const testDir = require('./util/test-dir')
const tnock = require('./util/tnock')

const CACHE = testDir(__filename)
const Manifest = require('../lib/finalize-manifest').Manifest
const manifest = require('../manifest')

// This is what the server sends
const BASE = {
  name: 'foo',
  version: '1.2.3',
  _hasShrinkwrap: false,
  dist: {
    shasum: 'deadbeef',
    tarball: 'https://foo.bar/x.tgz'
  }
}
// This is what's returned by finalize-manifest
const PKG = new Manifest({
  name: 'foo',
  version: '1.2.3',
  _hasShrinkwrap: false,
  _shasum: BASE.dist.shasum,
  _resolved: BASE.dist.tarball
})
const META = {
  'dist-tags': {
    latest: '1.2.3'
  },
  versions: {
    '1.2.3': BASE
  }
}

npmlog.level = process.env.LOGLEVEL || 'silent'
const OPTS = {
  cache: CACHE,
  registry: 'https://mock.reg',
  log: npmlog,
  retry: {
    retries: 1,
    factor: 1,
    minTimeout: 1,
    maxTimeout: 10
  },
  metadata: {
    etag: 'my-etage',
    lastModified: 'my-lastmodified',
    time: +(new Date())
  }
}

test('memoizes identical registry requests', t => {
  t.plan(2)
  const srv = tnock(t, OPTS.registry)

  srv.get('/foo').once().reply(200, META)
  return manifest('foo@1.2.3', OPTS).then(pkg => {
    t.deepEqual(pkg, PKG, 'got a manifest')
    return testDir.reset(CACHE)
  }).then(() => {
    return manifest('foo@1.2.3', OPTS)
  }).then(pkg => {
    t.deepEqual(pkg, PKG, 'got a manifest')
  })
})

test('tag requests memoize versions', t => {
  t.plan(2)
  const srv = tnock(t, OPTS.registry)

  srv.get('/foo').once().reply(200, META)
  return manifest('foo@latest', OPTS).then(pkg => {
    t.deepEqual(pkg, PKG, 'got a manifest')
    return testDir.reset(CACHE)
  }).then(() => {
    return manifest('foo@1.2.3', OPTS)
  }).then(pkg => {
    t.deepEqual(pkg, PKG, 'got a manifest')
  })
})

test('tag requests memoize tags', t => {
  t.plan(2)
  const srv = tnock(t, OPTS.registry)

  srv.get('/foo').once().reply(200, META)
  return manifest('foo@latest', OPTS).then(pkg => {
    t.deepEqual(pkg, PKG, 'got a manifest')
    return testDir.reset(CACHE)
  }).then(() => {
    return manifest('foo@latest', OPTS)
  }).then(pkg => {
    t.deepEqual(pkg, PKG, 'got a manifest')
  })
})

test('memoization is scoped to a given cache')

test('inflights concurrent requests', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/foo').once().reply(200, META)
  return BB.join(
    manifest('foo@1.2.3', OPTS).then(pkg => {
      t.deepEqual(pkg, PKG, 'got a manifest')
    }),
    manifest('foo@1.2.3', OPTS).then(pkg => {
      t.deepEqual(pkg, PKG, 'got a manifest')
    })
  )
})

test('supports fetching from an optional cache', t => {
  tnock(t, OPTS.registry)
  const key = cache.key('registry-request', OPTS.registry + '/foo')
  return cache.put(CACHE, key, JSON.stringify(META), OPTS).then(() => {
    return manifest('foo@1.2.3', OPTS).then(pkg => {
      t.deepEqual(pkg, PKG)
    })
  })
})

test('falls back to registry if cache entry missing', t => {
  const opts = {
    registry: OPTS.registry,
    log: OPTS.log,
    retry: OPTS.retry,
    cache: CACHE
  }
  const srv = tnock(t, opts.registry)
  srv.get('/foo').reply(200, META)
  return manifest('foo@1.2.3', opts).then(pkg => {
    t.deepEqual(pkg, PKG)
  })
})

test('expires stale request data')
test('allows forcing use of cache when data stale')
test('falls back to registry if cache entry is invalid JSON')

// This test should prevent future footgunning if the caching logic changes
// accidentally. Caching manifests themselves should be entirely the job of the
// package fetcher.
test('does not insert plain manifests into the cache')
