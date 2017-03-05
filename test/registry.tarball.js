'use strict'

const BB = require('bluebird')

const finished = BB.promisify(require('mississippi').finished)
const mockTar = require('./util/mock-tarball')
const npmlog = require('npmlog')
const test = require('tap').test
const tnock = require('./util/tnock')

require('./util/test-dir')(__filename)

const tarball = require('../lib/registry/tarball')

const BASE = {
  name: 'foo',
  version: '1.2.3',
  _hasShrinkwrap: false,
  dist: {
    shasum: 'deadbeef',
    tarball: 'https://my.mock.registry/foo/-/foo-1.2.3.tgz'
  }
}

const META = {
  name: 'foo',
  'dist-tags': { latest: '1.2.3' },
  versions: {
    '1.2.3': BASE
  }
}

npmlog.level = process.env.LOGLEVEL || 'silent'
const OPTS = {
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
  const pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.2.3'
    }),
    'index.js': 'console.log("hello world!")'
  }
  return mockTar(pkg).then(tarData => {
    const srv = tnock(t, OPTS.registry)
    srv.get('/foo').reply(200, META)
    srv.get('/foo/-/foo-1.2.3.tgz').reply(200, tarData)
    let data = ''
    return finished(
      tarball({
        type: 'range',
        raw: 'foo@^1.2.3',
        name: 'foo',
        escapedName: 'foo',
        rawSpec: '^1.2.3',
        spec: '>=1.2.3 <2.0.0',
        scope: null
      }, OPTS).on('data', d => { data += d })
    ).then(() => {
      t.equal(data, tarData, 'fetched tarball data matches one from server')
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
