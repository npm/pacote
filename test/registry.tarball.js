'use strict'

const getBuff = require('get-stream').buffer
const mockTar = require('./util/mock-tarball')
const npa = require('npm-package-arg')
const npmlog = require('npmlog')
const ssri = require('ssri')
const test = require('tap').test
const tnock = require('./util/tnock')

require('./util/test-dir')(__filename)

const fetch = require('../lib/fetch')

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
      integrity: ssri.fromData(tarData, { algorithms: ['sha1'] }).toString(),
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
    return getBuff(fetch.tarball(npa('foo@^1.2.3'), OPTS)).then(data => {
      t.deepEqual(data, tarData, 'fetched tarball data matches')
    })
  })
})

test('aliased tarball streaming', t => {
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
    return getBuff(
      fetch.tarball(npa('bar@npm:foo@^1.2.3'), OPTS)
    ).then(data => {
      t.deepEqual(data, tarData, 'fetched tarball data matches')
    })
  })
})

test('errors if manifest fails', t => {
  const pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.2.3'
    }),
    'index.js': 'console.log("hello world!")'
  }
  return mockTar(pkg).then(tarData => {
    const srv = tnock(t, OPTS.registry)
    srv.get('/foo').times(2).reply(404)
    return getBuff(fetch.tarball(npa('foo@^1.2.3'), OPTS)).then(data => {
      throw new Error('this was not supposed to succeed ' + data.length + data.toString('utf8'))
    }).catch(err => {
      t.ok(err, 'correctly errored')
      t.notMatch(err.message, /not supposed to succeed/)
      t.equal(err.code, 'E404', 'got a 404 back')
    })
  })
})

test('errors if tarball fetching fails', t => {
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
    srv.get('/foo/-/foo-1.2.3.tgz').reply(404)
    return getBuff(fetch.tarball(npa('foo@^1.2.3'), OPTS)).then(data => {
      throw new Error('this was not supposed to succeed ' + data.length + data.toString('utf8'))
    }).catch(err => {
      t.ok(err, 'correctly errored')
      t.notMatch(err.message, /not supposed to succeed/)
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
    return getBuff(fetch.tarball(npa('foo@^1.2.3'), OPTS)).then(data => {
      t.deepEqual(data, tarData, 'fetched tarball from https server')
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
    return getBuff(fetch.tarball(npa('foo@^1.2.3'), OPTS)).then(data => {
      t.deepEqual(data, tarData, 'fetched tarball from https server and adjusted port')
    })
  })
})

test('can use opts.resolved instead of manifest._resolved', t => {
  const pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.2.3'
    }),
    'index.js': 'console.log("hello world!")'
  }
  return mockTar(pkg).then(tarData => {
    const srv = tnock(t, OPTS.registry)
    const opts = Object.assign({}, OPTS, {
      resolved: `${OPTS.registry}foo/-/foo-is-here.tgz`
    })
    srv.get('/foo/-/foo-is-here.tgz').reply(200, tarData)
    return getBuff(fetch.tarball(npa('foo@^1.2.3'), opts)).then(data => {
      t.deepEqual(data, tarData, 'fetched tarball from passed-in resolved')
    })
  })
})

test('opts.resolved is ignored if url points to a different host', t => {
  const pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.2.3'
    }),
    'index.js': 'console.log("hello world!")'
  }
  return mockTar(pkg).then(tarData => {
    const srv = tnock(t, OPTS.registry)
    const opts = Object.assign({}, OPTS, {
      resolved: `https://some-other-registry/foo/-/foo-is-here.tgz`
    })
    srv.get('/foo').reply(200, META(tarData))
    srv.get('/foo/-/foo-1.2.3.tgz').reply(200, tarData)
    return getBuff(fetch.tarball(npa('foo@^1.2.3'), opts)).then(data => {
      t.deepEqual(data, tarData, 'fetched tarball from manifest url')
    })
  })
})
