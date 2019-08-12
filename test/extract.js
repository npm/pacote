'use strict'

const BB = require('bluebird')

const fs = BB.promisifyAll(require('fs'))
const mockTar = require('./util/mock-tarball')
const npmlog = require('npmlog')
const path = require('path')
const ssri = require('ssri')
const test = require('tap').test

const testDir = require('./util/test-dir')(__filename)

const extract = require('../extract.js')

npmlog.level = process.env.LOGLEVEL || 'silent'
const OPTS = {
  log: npmlog,
  registry: 'https://my.mock.registry/',
  retry: false
}

test('parses string specs into specifiers')
test('accepts realized package specifiers')
test('dispatches a different handler based on spec type')
test('looks up the manifest for the given spec')
test('extracts given spec to a target directory')
test('skips manifest fetching of opts.digest in cache')

test('validates dest and cache args', t => {
  t.throws(() => extract('foo'),
    TypeError('Extract requires a destination'))
  t.throws(() => extract('github:person/repo', '/tmp', {}),
    TypeError('Extracting git packages requires a cache folder'))
  t.end()
})

test('opts.resolved `file:` specs bypass further resolution', t => {
  const pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.2.3'
    }),
    'index.js': 'console.log("hello world!")'
  }
  const dest = path.join(testDir, 'foo')
  let sri
  return mockTar(pkg)
    .then(tarData => {
      sri = ssri.fromData(tarData)
      const opts = Object.assign({}, OPTS, {
        integrity: sri,
        resolved: 'file:foo-1.2.3.tgz',
        where: testDir
      })
      return fs.writeFileAsync(path.join(testDir, 'foo-1.2.3.tgz'), tarData)
        .then(() => extract('foo@1.2.3', dest, opts))
    })
    .then(() => fs.readFileAsync(path.join(dest, 'index.js'), 'utf8'))
    .then(data => t.equal(data, pkg['index.js'], 'index.js extracted ok'))
    .then(() => fs.readFileAsync(path.join(dest, 'package.json'), 'utf8'))
    .then(JSON.parse)
    .then(json => t.deepEqual(json, {
      name: 'foo',
      version: '1.2.3',
      _resolved: 'file:foo-1.2.3.tgz',
      _integrity: sri.toString(),
      _from: 'foo@1.2.3'
    }, 'package.json written ok with extra _fields'))
})
