'use strict'

const BB = require('bluebird')

const fs = require('fs')
const mkdirp = BB.promisify(require('mkdirp'))
const npmlog = require('npmlog')
const path = require('path')
const { test } = require('tap')

const extract = require('../extract')
const manifest = require('../manifest')

const CACHE = require('./util/test-dir')(__filename)

const writeFile = BB.promisify(fs.writeFile)
const readFile = BB.promisify(fs.readFile)

npmlog.level = process.env.LOGLEVEL || 'silent'

test('supports directory deps', t => {
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
    dependencies: { bar: '3.2.1' }
  }
  const PKG = path.join(CACHE, 'pkg')
  const EXT = path.join(CACHE, 'extracted')
  return mkdirp(path.join(PKG, 'x')).then(() => {
    return Promise.all([
      writeFile(
        path.join(PKG, 'package.json'), JSON.stringify(pkg)
      ),
      writeFile(
        path.join(PKG, 'npm-shrinkwrap.json'), JSON.stringify(sr)
      ),
      writeFile(
        path.join(PKG, 'x', 'mybin'), 'console.log("hi there")'
      )])
  }).then(() => {
    return manifest(PKG)
  }).then(manifest => {
    t.deepEqual(manifest, {
      name: pkg.name,
      version: pkg.version,
      cpu: null,
      engines: null,
      os: null,
      dependencies: pkg.dependencies,
      optionalDependencies: {},
      devDependencies: {},
      bundleDependencies: false,
      peerDependencies: {},
      deprecated: false,
      _resolved: path.resolve(PKG).replace(/\\/g, '/'),
      _shasum: null,
      _integrity: null,
      _shrinkwrap: sr,
      bin: { mybin: path.join('x', 'mybin') },
      _id: `${pkg.name}@${pkg.version}`
    }, 'got a filled-out manifest')
  }).then(() => {
    return extract(PKG, EXT, { log: npmlog })
  }).then(() => {
    return Promise.all([
      readFile(
        path.join(EXT, 'package.json'), 'utf8'
      ),
      readFile(
        path.join(EXT, 'npm-shrinkwrap.json'), 'utf8'
      ),
      readFile(
        path.join(EXT, 'x', 'mybin'), 'utf8'
      )
    ]).then(([xpkg, xsr, xbin]) => {
      t.similar(JSON.parse(xpkg), pkg, 'extracted package.json')
      t.deepEqual(JSON.parse(xsr), sr, 'extracted npm-shrinkwrap.json')
      t.deepEqual(xbin, 'console.log("hi there")', 'extracted binary')
    })
  })
})
