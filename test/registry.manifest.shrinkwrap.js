'use strict'

const npmlog = require('npmlog')
const tar = require('tar-stream')
const test = require('tap').test
const tnock = require('./util/tnock')

const manifest = require('../manifest')

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

const PKG = {
  name: 'foo',
  version: '1.2.3'
}

const SHRINKWRAP = {
  name: 'foo',
  version: '1.2.3'
}

const META = {
  name: 'foo',
  'dist-tags': { latest: '1.2.3', lts: '1.2.1' },
  versions: {
    '1.2.1': {
      name: 'foo',
      version: '1.2.1'
    },
    '1.2.3': PKG
  }
}

let TARBALL = ''
test('tarball setup', t => {
  const pack = tar.pack()
  pack.entry({ name: 'package/npm-shrinkwrap.json' }, JSON.stringify(SHRINKWRAP))
  pack.entry({ name: 'package/package.json' }, JSON.stringify(PKG))
  pack.finalize()
  pack.on('error', function (e) { throw e })
  pack.on('end', function () { t.end() })
  pack.on('data', function (d) { TARBALL += d })
})

test('fetches shrinkwrap data if missing + required', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/foo').reply(200, META)
  srv.get('/foo/-/foo-1.2.3.tgz').reply(200, TARBALL)
  return manifest('foo@1.2.3', OPTS).then(pkg => {
    t.ok(pkg, 'got a package manifest')
    t.deepEqual(pkg._shrinkwrap, SHRINKWRAP, 'got a shrinkwrap')
  })
})

test('caches package data on shrinkwrap-related fetch')
test('fails if shrinkwrap fetch failed + no caching')
test('fails if shrinkwrap data fails to parse')
test('fetches shrinkwrap data from existing local content')
