'use strict'

const npmlog = require('npmlog')
const tar = require('tar-stream')
const crypto = require('crypto')
const test = require('tap').test
const tnock = require('./util/tnock')
const cache = require('../lib/cache')
const testDir = require('./util/test-dir')
const CACHE = testDir(__filename)
const prefetch = require('../prefetch')
const mockTar = require('./util/mock-tarball')

npmlog.level = process.env.LOGLEVEL || 'silent'
const BASE = {
  name: 'foo',
  version: '1.0.0',
  _hasShrinkwrap: false,
  _resolved: 'https://foo.bar/x.tgz',
  dist: {
    tarball: 'https://foo.bar/x.tgz'
  }
}

const OPTS = {
  registry: 'https://mock.reg',
  log: npmlog,
  cache: CACHE
}

const META = {
  name: 'foo',
  'dist-tags': { latest: '1.2.3', lts: '1.0.0' },
  versions: {
    '1.0.0': BASE,
  }
}

const PKG = {
  'package.json': JSON.stringify({
    name: 'foo',
    version: '1.2.3'
  }),
  'index.js': 'console.log("hello world!")'
}

const SHRINKWRAP = {
  name: 'foo',
  version: '1.0.0'
}

test('prefetch by manifest if no digest', t => {
  return mockTar(PKG).then(tarData => {
    const srv = tnock(t, OPTS.registry)
    srv.get('/foo').reply(200, META)
    tnock(t, 'https://foo.bar').get('/x.tgz').reply(200, tarData)

    return prefetch('foo@1.0.0', OPTS).then(() => {
      t.equal(srv.isDone(), true)
      return cache.ls(CACHE)
    }).then(result => {
      t.equal(Object.keys(result).length, 2)
    })
  })
})

test('skip if no cache is provided', t => {
  return prefetch('foo@1.0.0', {}).then(() => {
    return cache.ls(CACHE)
  }).then(result => {
    t.equal(Object.keys(result).length, 0)
  })
})

test('use cache content if found', t => {
  const key = cache.key('registry-request', OPTS.registry + '/foo')
  return cache.put(CACHE, key, JSON.stringify(META), OPTS).then(digest => {
    OPTS.digest = digest
    OPTS.hashAlgorithm = 'sha512'
    return prefetch('foo@1.0.0', OPTS).then(() => {
      return cache.ls(CACHE)
    }).then(result => {
      t.equal(Object.keys(result).length, 1)
    })
  })
})

test('prefetch by manifest if digest provided but no cache content found', t => {
  return mockTar(PKG).then(tarData => {
    const srv = tnock(t, OPTS.registry)
    srv.get('/foo').reply(200, META)

    tnock(t, 'https://foo.bar').get('/x.tgz').reply(200, tarData)
    const sha = crypto.createHash('sha1').update(tarData).digest('hex')
    OPTS.digest = sha

    return prefetch('foo@1.0.0', OPTS).then(() => {
      t.equal(srv.isDone(), true)
      return cache.ls(CACHE)
    }).then(result => {
      t.equal(Object.keys(result).length, 2)
    })
  })
})
