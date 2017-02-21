'use strict'

var crypto = require('crypto')
var npmlog = require('npmlog')
var path = require('path')
var tar = require('tar-stream')
var test = require('tap').test
var tnock = require('./util/tnock')

require('./util/test-dir')(__filename)

var finalizeManifest = require('../lib/finalize-manifest')

npmlog.level = process.env.LOGLEVEL || 'silent'
var OPTS = {
  registry: 'https://mock.reg/',
  log: npmlog,
  retry: {
    retries: 1,
    factor: 1,
    minTimeout: 1,
    maxTimeout: 10
  }
}

test('returns a manifest with the right fields', function (t) {
  var base = {
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
    _hasShrinkwrap: false
  }
  finalizeManifest(base, {}, OPTS, function (err, manifest) {
    if (err) { throw err }
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
      _id: 'testing@1.2.3'
    }, 'fields as expected')
    t.end()
  })
})

test('defaults all field to expected types + values', function (t) {
  var base = {
    name: 'testing',
    version: '1.2.3',
    _resolved: 'resolved.to.this',
    _shasum: 'deadbeefc0ffeebad1dea',
    _hasShrinkwrap: false
  }
  finalizeManifest(base, {}, OPTS, function (err, manifest) {
    if (err) { throw err }
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
      _id: 'testing@1.2.3'
    }, 'fields defaulted as expected')
    t.end()
  })
})

test('fills in shrinkwrap if missing', function (t) {
  var tarballPath = 'testing/tarball-1.2.3.tgz'
  var base = {
    name: 'testing',
    version: '1.2.3',
    _resolved: OPTS.registry + tarballPath,
    _shasum: 'deadbeefc0ffeebad1dea',
    _hasShrinkwrap: true
  }
  var sr = {
    name: base.name,
    version: base.version
  }
  makeTarball({
    'package.json': base,
    'npm-shrinkwrap.json': sr
  }, function (err, tarData) {
    if (err) { throw err }
    tnock(t, OPTS.registry).get('/' + tarballPath).reply(200, tarData)
    finalizeManifest(base, {
      name: base.name,
      type: 'range'
    }, OPTS, function (err, manifest) {
      if (err) { throw err }
      t.deepEqual(manifest._shrinkwrap, sr, 'shrinkwrap successfully added')
      t.end()
    })
  })
})

test('fills in shasum if missing', function (t) {
  var tarballPath = 'testing/tarball-1.2.3.tgz'
  var base = {
    name: 'testing',
    version: '1.2.3',
    _resolved: OPTS.registry + tarballPath,
    _hasShrinkwrap: false
  }
  var sr = {
    name: base.name,
    version: base.version
  }
  makeTarball({
    'package.json': base,
    'npm-shrinkwrap.json': sr
  }, function (err, tarData) {
    if (err) { throw err }
    var sha = crypto.createHash('sha1').update(tarData).digest('hex')
    tnock(t, OPTS.registry).get('/' + tarballPath).reply(200, tarData)
    finalizeManifest(base, {
      name: base.name,
      type: 'range'
    }, OPTS, function (err, manifest) {
      if (err) { throw err }
      t.deepEqual(manifest._shasum, sha, 'shasum successfully added')
      t.end()
    })
  })
})

test('fills in `bin` if `directories.bin` string', function (t) {
  var tarballPath = 'testing/tarball-1.2.3.tgz'
  var base = {
    name: 'testing',
    version: '1.2.3',
    directories: {
      bin: 'foo/my/bin'
    },
    _resolved: OPTS.registry + tarballPath,
    _shasum: 'deadbeefc0ffeebad1dea',
    _hasShrinkwrap: false
  }
  var sr = {
    name: base.name,
    version: base.version
  }
  makeTarball({
    'package.json': base,
    'npm-shrinkwrap.json': sr,
    'foo/my/bin/x.js': 'x()',
    'foo/my/bin/y': 'y()',
    'foo/my/bin/z/a.js': 'a() :D',
    'foo/my/nope': 'uhhh'
  }, function (err, tarData) {
    if (err) { throw err }
    tnock(t, OPTS.registry).get('/' + tarballPath).reply(200, tarData)
    finalizeManifest(base, {
      name: base.name,
      type: 'range'
    }, OPTS, function (err, manifest) {
      if (err) { throw err }
      t.deepEqual(manifest.bin, {
        'x.js': path.join('foo', 'my', 'bin', 'x.js'),
        'y': path.join('foo', 'my', 'bin', 'y'),
        'a.js': path.join('foo', 'my', 'bin', 'z', 'a.js'),
      }, 'bins successfully calculated')
      t.end()
    })
  })
})

test('fills in `bin` if original was an array', function (t) {
  var tarballPath = 'testing/tarball-1.2.3.tgz'
  var base = {
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
  finalizeManifest(base, {
    name: base.name,
    type: 'range'
  }, OPTS, function (err, manifest) {
    if (err) { throw err }
    t.deepEqual(manifest.bin, {
      'bin1': path.join('foo', 'my', 'bin1'),
      'bin2.js': path.join('foo', 'bin2.js')
    }, 'bins successfully calculated')
    t.end()
  })
})

// TODO - this is pending major changes in npm, so not implemented for now.
test('manifest returned is immutable + inextensible')

function makeTarball (files, cb) {
  var tarData = ''
  var pack = tar.pack()
  Object.keys(files).forEach(function (filename) {
    pack.entry({
      name: 'package/' + filename
    }, JSON.stringify(files[filename]))
  })
  pack.finalize()
  pack.on('data', function (d) { tarData += d })
  pack.on('error', cb)
  pack.on('end', function () { cb(null, tarData) })
}
