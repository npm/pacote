'use strict'

var npmlog = require('npmlog')
var tar = require('tar-stream')
var test = require('tap').test
var tnock = require('./util/tnock')

var manifest = require('../manifest')

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

var PKG = {
  name: 'foo',
  version: '1.2.3'
}

var SHRINKWRAP = {
  name: 'foo',
  version: '1.2.3'
}

var META = {
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

var TARBALL = ''
test('tarball setup', function (t) {
  var pack = tar.pack()
  pack.entry({ name: 'package/npm-shrinkwrap.json' }, JSON.stringify(SHRINKWRAP))
  pack.entry({ name: 'package/package.json' }, JSON.stringify(PKG))
  pack.finalize()
  pack.on('data', function (d) { TARBALL += d })
  pack.on('error', function (e) { throw e })
  pack.on('end', function () { t.end() })
})

test('fetches shrinkwrap data if missing + required', function (t) {
  var srv = tnock(t, OPTS.registry)

  srv.get('/foo').reply(200, META)
  srv.get('/foo/-/foo-1.2.3.tgz').reply(200, TARBALL)
  manifest('foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.ok(pkg, 'got a package manifest')
    t.deepEqual(pkg._shrinkwrap, SHRINKWRAP, 'got a shrinkwrap')
    t.end()
  })
})

test('caches package data on shrinkwrap-related fetch')
test('fails if shrinkwrap fetch failed + no caching')
test('fails if shrinkwrap data fails to parse')
test('fetches shrinkwrap data from existing local content')
