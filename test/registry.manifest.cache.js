'use strict'

const BB = require('bluebird')

const clearMemoized = require('..').clearMemoized
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
    integrity: 'sha1-deadbeef',
    tarball: 'https://foo.bar/x.tgz'
  }
}
// This is what's returned by finalize-manifest
const PKG = new Manifest({
  name: 'foo',
  version: '1.2.3',
  _hasShrinkwrap: false,
  _shasum: BASE.dist.shasum,
  _integrity: BASE.dist.integrity,
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
  }
}

const HEADERS = {
  'content-length': JSON.stringify(META).length
}

test('inflights concurrent requests', t => {
  clearMemoized()
  const srv = tnock(t, OPTS.registry)

  srv.get('/foo').once().reply(200, META, HEADERS)
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
  clearMemoized()
  tnock(t, OPTS.registry).get('/foo').once().reply(200, META, HEADERS)
  return manifest('foo@1.2.3', OPTS).then(() => {
    clearMemoized()
    return manifest('foo@1.2.3', OPTS).then(pkg => {
      t.deepEqual(pkg, PKG)
    })
  })
})

test('falls back to registry if cache entry missing', t => {
  clearMemoized()
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

test('tries again if cached data is missing target', t => {
  clearMemoized()
  const srv = tnock(t, OPTS.registry)
  srv.get('/foo').reply(() => {
    srv.get('/foo').reply(200, META, HEADERS)
    return [
      200, {
        versions: { '1.1.2': BASE }
      }, HEADERS
    ]
  })
  return manifest('foo@1.1.2', OPTS).then(pkg => {
    t.deepEqual(pkg, PKG, 'got expected package from network')
    clearMemoized()
    return manifest('foo@1.2.3', OPTS).then(pkg => {
      t.deepEqual(pkg, PKG, 'got updated package in spite of cache')
    })
  })
})
