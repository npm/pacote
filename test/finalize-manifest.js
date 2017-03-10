'use strict'

const BB = require('bluebird')

const crypto = require('crypto')
const npmlog = require('npmlog')
const path = require('path')
const tar = require('tar-stream')
const test = require('tap').test
const tnock = require('./util/tnock')

require('./util/test-dir')(__filename)

const finalizeManifest = require('../lib/finalize-manifest')

npmlog.level = process.env.LOGLEVEL || 'silent'
const OPTS = {
  registry: 'https://mock.reg/',
  log: npmlog,
  retry: {
    retries: 1,
    factor: 1,
    minTimeout: 1,
    maxTimeout: 10
  }
}

test('returns a manifest with the right fields', t => {
  const base = {
    name: 'testing',
    version: '1.2.3',
    dependencies: { x: '3.2.1' },
    devDependencies: {},
    optionalDependencies: {},
    bundleDependencies: [],
    peerDependencies: {},
    bin: './foo.js',
    _resolved: 'resolved.to.this',
    _shasum: 'deadbeefc0ffeebad1dea',
    _hasShrinkwrap: false,
    _deprecated: 'foo'
  }
  return finalizeManifest(base, {}, OPTS).then(manifest => {
    t.deepEqual(manifest, {
      name: 'testing',
      version: '1.2.3',
      dependencies: { x: '3.2.1' },
      devDependencies: {},
      optionalDependencies: {},
      bundleDependencies: [],
      peerDependencies: {},
      bin: {
        testing: './foo.js'
      },
      _resolved: 'resolved.to.this',
      _shasum: 'deadbeefc0ffeebad1dea',
      _shrinkwrap: null,
      _deprecated: 'foo',
      _id: 'testing@1.2.3'
    }, 'fields as expected')
  })
})

test('defaults all field to expected types + values', t => {
  const base = {
    name: 'testing',
    version: '1.2.3',
    _resolved: 'resolved.to.this',
    _shasum: 'deadbeefc0ffeebad1dea',
    _hasShrinkwrap: false
  }
  return finalizeManifest(base, {}, OPTS).then(manifest => {
    t.deepEqual(manifest, {
      name: base.name,
      version: base.version,
      dependencies: {},
      devDependencies: {},
      optionalDependencies: {},
      bundleDependencies: false, // because npm does boolean checks on this
      peerDependencies: {},
      bin: null,
      _resolved: base._resolved,
      _shasum: base._shasum,
      _shrinkwrap: null,
      _deprecated: false,
      _id: 'testing@1.2.3'
    }, 'fields defaulted as expected')
  })
})

test('fills in shrinkwrap if missing', t => {
  const tarballPath = 'testing/tarball-1.2.3.tgz'
  const base = {
    name: 'testing',
    version: '1.2.3',
    _resolved: OPTS.registry + tarballPath,
    _shasum: 'deadbeefc0ffeebad1dea',
    _hasShrinkwrap: true
  }
  const sr = {
    name: base.name,
    version: base.version
  }
  return makeTarball({
    'package.json': base,
    'npm-shrinkwrap.json': sr
  }).then(tarData => {
    tnock(t, OPTS.registry).get('/' + tarballPath).reply(200, tarData)
    return finalizeManifest(base, {
      name: base.name,
      type: 'range'
    }, OPTS).then(manifest => {
      t.deepEqual(manifest._shrinkwrap, sr, 'shrinkwrap successfully added')
    })
  })
})

test('fills in shasum if missing', t => {
  const tarballPath = 'testing/tarball-1.2.3.tgz'
  const base = {
    name: 'testing',
    version: '1.2.3',
    _resolved: OPTS.registry + tarballPath,
    _hasShrinkwrap: false
  }
  const sr = {
    name: base.name,
    version: base.version
  }
  return makeTarball({
    'package.json': base,
    'npm-shrinkwrap.json': sr
  }).then(tarData => {
    const sha = crypto.createHash('sha1').update(tarData).digest('hex')
    tnock(t, OPTS.registry).get('/' + tarballPath).reply(200, tarData)
    return finalizeManifest(base, {
      name: base.name,
      type: 'range'
    }, OPTS).then(manifest => {
      t.deepEqual(manifest._shasum, sha, 'shasum successfully added')
    })
  })
})

test('fills in `bin` if `directories.bin` string', t => {
  const tarballPath = 'testing/tarball-1.2.3.tgz'
  const base = {
    name: 'testing',
    version: '1.2.3',
    directories: {
      bin: 'foo/my/bin'
    },
    _resolved: OPTS.registry + tarballPath,
    _shasum: 'deadbeefc0ffeebad1dea',
    _hasShrinkwrap: false
  }
  const sr = {
    name: base.name,
    version: base.version
  }
  return makeTarball({
    'package.json': base,
    'npm-shrinkwrap.json': sr,
    'foo/my/bin/x.js': 'x()',
    'foo/my/bin/y': 'y()',
    'foo/my/bin/z/a.js': 'a() :D',
    'foo/my/nope': 'uhhh'
  }).then(tarData => {
    tnock(t, OPTS.registry).get('/' + tarballPath).reply(200, tarData)
    return finalizeManifest(base, {
      name: base.name,
      type: 'range'
    }, OPTS).then(manifest => {
      t.deepEqual(manifest.bin, {
        'x.js': path.join('foo', 'my', 'bin', 'x.js'),
        'y': path.join('foo', 'my', 'bin', 'y'),
        'a.js': path.join('foo', 'my', 'bin', 'z', 'a.js')
      }, 'bins successfully calculated')
    })
  })
})

test('fills in `bin` if original was an array', t => {
  const tarballPath = 'testing/tarball-1.2.3.tgz'
  const base = {
    name: 'testing',
    version: '1.2.3',
    bin: ['my/bin1', 'bin2.js'],
    directories: {
      bin: 'foo'
    },
    _resolved: OPTS.registry + tarballPath,
    _shasum: 'deadbeefc0ffeebad1dea',
    _hasShrinkwrap: false
  }
  return finalizeManifest(base, {
    name: base.name,
    type: 'range'
  }, OPTS).then(manifest => {
    t.deepEqual(manifest.bin, {
      'bin1': path.join('foo', 'my', 'bin1'),
      'bin2.js': path.join('foo', 'bin2.js')
    }, 'bins successfully calculated')
  })
})

// TODO - this is pending major changes in npm, so not implemented for now.
test('manifest returned is immutable + inextensible')

function makeTarball (files) {
  let tarData = ''
  const pack = tar.pack()
  Object.keys(files).forEach(function (filename) {
    pack.entry({
      name: 'package/' + filename
    }, JSON.stringify(files[filename]))
  })
  pack.finalize()
  return BB.fromNode(cb => {
    pack.on('data', function (d) { tarData += d })
    pack.on('error', cb)
    pack.on('end', function () { cb(null, tarData) })
  })
}
