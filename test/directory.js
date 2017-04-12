'use strict'

const BB = require('bluebird')

const fs = BB.promisifyAll(require('fs'))
const mkdirp = BB.promisify(require('mkdirp'))
const path = require('path')
const test = require('tap').test

const dirManifest = require('../lib/handlers/directory/manifest')
const dirTarball = require('../lib/handlers/directory/tarball')

const CACHE = require('./util/test-dir')(__filename)

test('supports directory dep manifests', t => {
  const pkg = {
    name: 'foo',
    version: '1.2.3',
    dependencies: { bar: '3.2.1' },
    directories: { bin: 'x' },
    randomProp: 'wut'
  }
  const sr = {
    name: 'foo',
    version: '1.2.3',
    isShrinkwrap: true,
    dependencies: { bar: '3.2.1' }
  }
  return mkdirp(path.join(CACHE, 'x')).then(() => {
    return BB.join(
      fs.writeFileAsync(
        path.join(CACHE, 'package.json'), JSON.stringify(pkg)
      ),
      fs.writeFileAsync(
        path.join(CACHE, 'npm-shrinkwrap.json'), JSON.stringify(sr)
      ),
      fs.writeFileAsync(
        path.join(CACHE, 'x', 'mybin'), 'console.log("hi there")'
      )
    )
  }).then(() => {
    return dirManifest({
      type: 'directory',
      spec: CACHE
    })
  }).then(manifest => {
    t.deepEqual(manifest, null, 'got a filled-out manifest')
  })
})

test('returns null instead of a stream for tarballs', t => {
  return mkdirp(CACHE).then(() => {
    return dirTarball({type: 'directory', spec: CACHE})
  }).then(tarball => {
    t.deepEqual(tarball, null, 'got null back')
  })
})
