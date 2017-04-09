'use strict'

const BB = require('bluebird')

const finished = BB.promisify(require('mississippi').finished)
const mockTar = require('./util/mock-tarball')
const npmlog = require('npmlog')
const ssri = require('ssri')
const test = require('tap').test
const tnock = require('./util/tnock')

require('./util/test-dir')(__filename)

const tarball = require('../lib/registry/tarball')

npmlog.level = process.env.LOGLEVEL || 'silent'
const OPTS = {
  log: npmlog,
  registry: 'https://my.mock.registry/',
  retry: false
}

function BASE (tarData, registry) {
  registry = registry || OPTS.registry
  return {
    name: 'foo',
    version: '1.2.3',
    _hasShrinkwrap: false,
    dist: {
      integrity: ssri.fromData(tarData, {algorithms: ['sha1']}).toString(),
      tarball: `${registry}foo/-/foo-1.2.3.tgz`
    }
  }
}

function META (tarData, registry) {
  registry = registry || OPTS.registry
  return {
    name: 'foo',
    'dist-tags': { latest: '1.2.3' },
    versions: {
      '1.2.3': BASE(tarData)
    }
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
    srv.get('/foo').reply(200, META(tarData))
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

test('errors if manifest fails', t => {
  var pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.2.3'
    }),
    'index.js': 'console.log("hello world!")'
  }
  return mockTar(pkg).then(tarData => {
    var srv = tnock(t, OPTS.registry)
    srv.get('/foo').reply(200, META(tarData))
    srv.get('/foo/-/foo-1.2.3.tgz').reply(404)
    return finished(tarball({
      type: 'range',
      raw: 'foo@^1.2.3',
      name: 'foo',
      escapedName: 'foo',
      rawSpec: '^1.2.3',
      spec: '>=1.2.3 <2.0.0',
      scope: null
    }, OPTS).on('data', () => {})).then(() => {
      throw new Error('this was not supposed to succeed')
    }).catch(err => {
      t.ok(err, 'correctly errored')
      t.equal(err.code, 'E404', 'got a 404 back')
    })
  })
})

test('tarball url updated to fit registry protocol', t => {
  const pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.2.3'
    }),
    'index.js': 'console.log("hello world!")'
  }
  return mockTar(pkg).then(tarData => {
    const srv = tnock(t, OPTS.registry)
    srv.get('/foo').reply(200, META(tarData, 'http://my.mock.registry/'))
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
      t.equal(data, tarData, 'fetched tarball from https server')
    })
  })
})

test('tarball url updated to fit registry protocol+port', t => {
  const pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.2.3'
    }),
    'index.js': 'console.log("hello world!")'
  }
  return mockTar(pkg).then(tarData => {
    const srv = tnock(t, OPTS.registry)
    srv.get('/foo').reply(200, META(tarData, 'http://my.mock.registry:567/'))
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
      t.equal(data, tarData, 'fetched tarball from https server and adjusted port')
    })
  })
})
