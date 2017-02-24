'use strict'

var finished = require('mississippi').finished
var mockTar = require('./util/mock-tarball')
var npmlog = require('npmlog')
var test = require('tap').test
var tnock = require('./util/tnock')

require('./util/test-dir')(__filename)

var tarball = require('../lib/registry/tarball')

var BASE = {
  name: 'foo',
  version: '1.2.3',
  _hasShrinkwrap: false,
  dist: {
    shasum: 'deadbeef',
    tarball: 'https://my.mock.registry/foo/-/foo-1.2.3.tgz'
  }
}

var META = {
  name: 'foo',
  'dist-tags': { latest: '1.2.3' },
  versions: {
    '1.2.3': BASE
  }
}

npmlog.level = process.env.LOGLEVEL || 'silent'
var OPTS = {
  log: npmlog,
  registry: 'https://my.mock.registry/',
  retry: {
    retries: 1,
    factor: 1,
    minTimeout: 1,
    maxTimeout: 10
  }
}

test('basic tarball streaming', function (t) {
  var pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.2.3'
    }),
    'index.js': 'console.log("hello world!")'
  }
  mockTar(pkg, function (err, tarData) {
    if (err) { throw err }
    var srv = tnock(t, OPTS.registry)
    srv.get('/foo').reply(200, META)
    srv.get('/foo/-/foo-1.2.3.tgz').reply(200, tarData)
    var data = ''
    finished(tarball({
      type: 'range',
      raw: 'foo@^1.2.3',
      name: 'foo',
      escapedName: 'foo',
      rawSpec: '^1.2.3',
      spec: '>=1.2.3 <2.0.0',
      scope: null
    }, OPTS).on('data', function (d) { data += d }), function (err) {
      if (err) { throw err }
      t.equal(data, tarData, 'fetched tarball data matches one from server')
      t.done()
    })
  })
})

// TODO - this is failing because the error is `premature close`, not 404
// test('errors if manifest fails', function (t) {
//   var pkg = {
//     'package.json': JSON.stringify({
//       name: 'foo',
//       version: '1.2.3'
//     }),
//     'index.js': 'console.log("hello world!")'
//   }
//   mockTar(pkg, function (err, tarData) {
//     if (err) { throw err }
//     var srv = tnock(t, OPTS.registry)
//     srv.get('/foo').reply(200, META)
//     srv.get('/foo/-/foo-1.2.3.tgz').reply(404)
//     finished(tarball({
//       type: 'range',
//       raw: 'foo@^1.2.3',
//       name: 'foo',
//       escapedName: 'foo',
//       rawSpec: '^1.2.3',
//       spec: '>=1.2.3 <2.0.0',
//       scope: null
//     }, OPTS).on('data', function (d) {}), function (err) {
//       t.ok(err, 'correctly errored')
//       t.equal(err.code, 'E404', 'got a 404 back')
//       t.done()
//     })
//   })
// })
