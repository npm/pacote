'use strict'

const BB = require('bluebird')

const cacache = require('cacache')
const clearMemoized = require('..').clearMemoized
const fs = BB.promisifyAll(require('fs'))
const getStream = require('get-stream')
const mockTar = require('./util/mock-tarball')
const npmlog = require('npmlog')
const path = require('path')
const ssri = require('ssri')
const Tacks = require('tacks')
const test = require('tap').test
const testDir = require('./util/test-dir')
const tnock = require('./util/tnock')

const CACHE = path.join(testDir(__filename), 'cache')

const Dir = Tacks.Dir
const File = Tacks.File

const tarball = require('../tarball')

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
    '1.0.0': BASE
  }
}

const PKG = {
  'package.json': JSON.stringify({
    name: 'foo',
    version: '1.2.3'
  }),
  'index.js': 'console.log("hello world!")'
}

test('setup integrity', t => {
  return mockTar(PKG).then(tarData => {
    const integrity = ssri.fromData(tarData, { algorithms: ['sha1'] })
    BASE.dist.integrity = BASE._integrity = integrity.toString()
    BASE.dist.shasum = BASE._shasum = integrity.hexDigest()
    return 'lol ok'
  })
})

test('tarball by manifest if no integrity hash', t => {
  clearMemoized()
  return mockTar(PKG).then(tarData => {
    const srv = tnock(t, OPTS.registry)
    srv.get('/foo').reply(200, META, {
      'Age': '200',
      'Date': new Date().toUTCString(),
      'cache-control': 'max-age=300'
    })
    tnock(t, 'https://foo.bar').get('/x.tgz').reply(200, tarData, {
      'cache-control': 'immutable'
    })

    return tarball('foo@1.0.0', OPTS).then(data => {
      t.equal(srv.isDone(), true, 'no pending requests')
      t.deepEqual(data, tarData, 'fetched tarball data matched')
      return cacache.ls(CACHE)
    }).then(result => {
      t.equal(Object.keys(result).length, 2, 'keys added to cache')
    })
  })
})

test('(stream) tarball by manifest if no integrity hash', t => {
  clearMemoized()
  return mockTar(PKG).then(tarData => {
    const srv = tnock(t, OPTS.registry)
    srv.get('/foo').reply(200, META, {
      'Age': '200',
      'Date': new Date().toUTCString(),
      'cache-control': 'max-age=300'
    })
    tnock(t, 'https://foo.bar').get('/x.tgz').reply(200, tarData, {
      'cache-control': 'immutable'
    })

    return getStream.buffer(tarball.stream('foo@1.0.0', OPTS)).then(data => {
      t.equal(srv.isDone(), true, 'no pending requests')
      t.deepEqual(data, tarData, 'fetched tarball data matched')
      return cacache.ls(CACHE)
    }).then(result => {
      t.equal(Object.keys(result).length, 2, 'keys added to cache')
    })
  })
})

test('(toFile) tarball by manifest if no integrity hash', t => {
  clearMemoized()
  return mockTar(PKG).then(tarData => {
    const srv = tnock(t, OPTS.registry)
    srv.get('/foo').reply(200, META, {
      'Age': '200',
      'Date': new Date().toUTCString(),
      'cache-control': 'max-age=300'
    })
    tnock(t, 'https://foo.bar').get('/x.tgz').reply(200, tarData, {
      'cache-control': 'immutable'
    })

    return tarball.toFile('foo@1.0.0', './dir/foo.tgz', OPTS).then(() => {
      t.equal(srv.isDone(), true, 'no pending requests')
      return fs.readFileAsync('./dir/foo.tgz')
    }).then(data => {
      t.deepEqual(data, tarData, 'tarball data from file matches')
      return cacache.ls(CACHE)
    }).then(result => {
      t.equal(Object.keys(result).length, 2, 'keys added to cache')
    })
  })
})

test('use cache content if found', t => {
  clearMemoized()
  tnock(t, OPTS.registry).get('/foo').reply(200, META)
  return mockTar(PKG).then(tarData => {
    tnock(t, 'https://foo.bar').get('/x.tgz').reply(200, tarData)
    return tarball('foo@1.0.0', OPTS).then(() => {
      clearMemoized()
      return tarball('foo@1.0.0', OPTS)
    }).then(data => {
      t.deepEqual(data, tarData, 'fetched from cache')
      return cacache.ls(CACHE)
    }).then(result => {
      t.equal(Object.keys(result).length, 2, 'both entries in the cache')
    })
  })
})

test('(stream) use cache content if found', t => {
  clearMemoized()
  tnock(t, OPTS.registry).get('/foo').reply(200, META)
  return mockTar(PKG).then(tarData => {
    tnock(t, 'https://foo.bar').get('/x.tgz').reply(200, tarData)
    return getStream.buffer(tarball.stream('foo@1.0.0', OPTS)).then(() => {
      clearMemoized()
      return getStream.buffer(tarball.stream('foo@1.0.0', OPTS))
    }).then(data => {
      t.deepEqual(data, tarData, 'fetched from cache')
      return cacache.ls(CACHE)
    }).then(result => {
      t.equal(Object.keys(result).length, 2, 'both entries in the cache')
    })
  })
})

test('(toFile) use cache content if found', t => {
  clearMemoized()
  tnock(t, OPTS.registry).get('/foo').reply(200, META)
  return mockTar(PKG).then(tarData => {
    tnock(t, 'https://foo.bar').get('/x.tgz').reply(200, tarData)
    return tarball('foo@1.0.0', OPTS).then(() => {
      clearMemoized()
      return tarball.toFile('foo@1.0.0', './dir/foo.tgz', OPTS)
    }).then(() => {
      return fs.readFileAsync('./dir/foo.tgz')
    }).then(data => {
      t.deepEqual(data, tarData, 'fetched from cache')
      return cacache.ls(CACHE)
    }).then(result => {
      t.equal(Object.keys(result).length, 2, 'both entries in the cache')
    })
  })
})

test('tarball by manifest if digest provided but no cache content found', t => {
  clearMemoized()
  return mockTar(PKG).then(tarData => {
    const srv = tnock(t, OPTS.registry)
    srv.get('/foo').reply(200, META)

    tnock(t, 'https://foo.bar').get('/x.tgz').reply(200, tarData)
    const integrity = ssri.fromData(tarData)
    OPTS.digest = integrity

    return tarball('foo@1.0.0', OPTS).then(data => {
      t.equal(srv.isDone(), true, 'no pending requests')
      t.deepEqual(data, tarData, 'fetched by manifest')
      return cacache.ls(CACHE)
    }).then(result => {
      t.equal(Object.keys(result).length, 2, 'keys added to cache')
    })
  })
})

test('(stream) tarball by manifest if digest provided but no cache content found', t => {
  clearMemoized()
  return mockTar(PKG).then(tarData => {
    const srv = tnock(t, OPTS.registry)
    srv.get('/foo').reply(200, META)

    tnock(t, 'https://foo.bar').get('/x.tgz').reply(200, tarData)
    const integrity = ssri.fromData(tarData)
    OPTS.digest = integrity

    return getStream.buffer(tarball.stream('foo@1.0.0', OPTS)).then(data => {
      t.equal(srv.isDone(), true, 'no pending requests')
      t.deepEqual(data, tarData, 'fetched by manifest')
      return cacache.ls(CACHE)
    }).then(result => {
      t.equal(Object.keys(result).length, 2, 'keys added to cache')
    })
  })
})

test('(toFile) tarball by manifest if digest provided but no cache content found', t => {
  clearMemoized()
  return mockTar(PKG).then(tarData => {
    const srv = tnock(t, OPTS.registry)
    srv.get('/foo').reply(200, META)

    tnock(t, 'https://foo.bar').get('/x.tgz').reply(200, tarData)
    const integrity = ssri.fromData(tarData)
    OPTS.digest = integrity

    return tarball.toFile('foo@1.0.0', './dir/foo.tgz', OPTS).then(() => {
      return fs.readFileAsync('./dir/foo.tgz')
    }).then(data => {
      t.equal(srv.isDone(), true, 'no pending requests')
      t.deepEqual(data, tarData, 'fetched by manifest')
      return cacache.ls(CACHE)
    }).then(result => {
      t.equal(Object.keys(result).length, 2, 'keys added to cache')
    })
  })
})

test('opts.resolved shortcut for `file:` skips metadata and cache', t => {
  clearMemoized()
  return mockTar(PKG)
    .then(tarData => {
      const fixture = new Tacks(Dir({
        resolved: Dir({
          'foo.tgz': File(tarData)
        })
      }))
      fixture.create(CACHE)
      const opts = Object.assign({}, OPTS, {
        integrity: BASE.dist.integrity,
        resolved: 'file:' + path.join(CACHE, 'resolved', 'foo.tgz')
      })
      return tarball('foo@1.0.0', opts)
        .then(data => {
          t.deepEqual(data, tarData, 'fetched from locally-resolved file')
        })
        .then(() => tarball('bar@git://github.com/foo/bar', opts))
        .then(data => {
          t.deepEqual(data, tarData, 'non-registry types use opts.resolved too')
        })
    })
})

test('(stream) opts.resolved shortcut for `file:`', t => {
  clearMemoized()
  return mockTar(PKG)
    .then(tarData => {
      const fixture = new Tacks(Dir({
        resolved: Dir({
          'foo.tgz': File(tarData)
        })
      }))
      fixture.create(CACHE)
      const opts = Object.assign({}, OPTS, {
        integrity: BASE.dist.integrity,
        resolved: 'file:' + path.join(CACHE, 'resolved', 'foo.tgz')
      })
      return getStream.buffer(tarball.stream('foo@1.0.0', opts))
        .then(data => {
          t.deepEqual(data, tarData, 'fetched from locally-resolved file')
        })
        .then(() => getStream.buffer(
          tarball.stream('bar@git://github.com/foo/bar', opts))
        )
        .then(data => {
          t.deepEqual(data, tarData, 'non-registry types use opts.resolved too')
        })
    })
})
