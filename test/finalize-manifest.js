'use strict'

const BB = require('bluebird')

const cache = require('../lib/cache')
const npmlog = require('npmlog')
const path = require('path')
const ssri = require('ssri')
const tar = require('tar-stream')
const test = require('tap').test
const testDir = require('./util/test-dir')
const tnock = require('./util/tnock')

const CACHE = testDir(__filename)

const finalizeManifest = require('../lib/finalize-manifest')

npmlog.level = process.env.LOGLEVEL || 'silent'
const OPTS = {
  registry: 'https://mock.reg/',
  log: npmlog,
  retry: {
    retries: 0,
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
    _integrity: 'sha1-deadbeefc0ffeebad1dea',
    _hasShrinkwrap: false,
    deprecated: 'foo'
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
      _integrity: 'sha1-deadbeefc0ffeebad1dea',
      _shrinkwrap: null,
      deprecated: 'foo',
      _id: 'testing@1.2.3'
    }, 'fields as expected')
  })
})

test('defaults all field to expected types + values', t => {
  const base = {
    name: 'testing',
    version: '1.2.3',
    _resolved: 'resolved.to.this',
    _integrity: 'sha1-deadbeefc0ffeebad1dea',
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
      _integrity: base._integrity,
      _shrinkwrap: null,
      deprecated: false,
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

test('fills in integrity hash if missing', t => {
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
    const integrity = ssri.fromData(tarData, {algorithms: ['sha1']}).toString()
    tnock(t, OPTS.registry).get('/' + tarballPath).reply(200, tarData)
    return finalizeManifest(base, {
      name: base.name,
      type: 'range'
    }, OPTS).then(manifest => {
      t.deepEqual(manifest._integrity, integrity, 'integrity hash successfully added')
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
    _integrity: 'sha1-deadbeefc0ffeebad1dea',
    _resolved: OPTS.registry + tarballPath,
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

test('uses package.json as base if passed null', t => {
  const tarballPath = 'testing/tarball-1.2.3.tgz'
  const base = {
    name: 'testing',
    version: '1.2.3',
    dependencies: { foo: '1' },
    directories: { bin: 'foo' }
  }
  const sr = {
    name: base.name,
    version: base.version
  }
  return makeTarball({
    'package.json': base,
    'npm-shrinkwrap.json': sr,
    'foo/x': 'x()'
  }).then(tarData => {
    tnock(t, OPTS.registry).get('/' + tarballPath).reply(200, tarData)
    return finalizeManifest(null, {
      fetchSpec: OPTS.registry + tarballPath,
      type: 'remote'
    }, OPTS).then(manifest => {
      t.deepEqual(manifest, {
        name: base.name,
        version: base.version,
        dependencies: base.dependencies,
        optionalDependencies: {},
        devDependencies: {},
        bundleDependencies: false,
        peerDependencies: {},
        _resolved: OPTS.registry + tarballPath,
        deprecated: false,
        _integrity: ssri.fromData(tarData, {algorithms: ['sha1']}).toString(),
        _shrinkwrap: sr,
        bin: { 'x': path.join('foo', 'x') },
        _id: 'testing@1.2.3'
      }, 'entire manifest filled out from tarball')
    })
  })
})

test('caches finalized manifests', t => {
  cache.clearMemoized()
  const tarballPath = 'testing/tarball-1.2.3.tgz'
  const base = {
    name: 'testing',
    version: '1.2.3',
    _resolved: OPTS.registry + tarballPath,
    _hasShrinkwrap: true
  }
  const sr = {
    name: base.name,
    version: base.version
  }
  const opts = Object.create(OPTS)
  opts.cache = CACHE
  return makeTarball({
    'package.json': base,
    'npm-shrinkwrap.json': sr
  }).then(tarData => {
    tnock(t, OPTS.registry).get('/' + tarballPath).reply(200, tarData)
    return finalizeManifest(base, {
      name: base.name,
      type: 'range'
    }, opts).then(manifest1 => {
      base._integrity = manifest1._integrity
      return cache.ls(CACHE, opts).then(entries => {
        const promises = []
        Object.keys(entries).forEach(k => {
          if (!k.match(/^pacote:range-manifest/)) {
            promises.push(cache.put(CACHE, k, '', opts))
          } else {
            t.ok(true, 'manifest entry exists in cache: ' + k)
          }
        })
        return BB.all(promises)
      }).then(() => {
        return finalizeManifest(base, {
          name: base.name,
          type: 'range'
        }, opts)
      }).then(manifest2 => {
        t.deepEqual(manifest2, manifest1, 'got cached manifest')
      })
    })
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
