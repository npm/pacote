'use strict'

const BB = require('bluebird')

const pipe = BB.promisify(require('mississippi').pipe)
const Tacks = require('tacks')
const tar = require('tar')
const { test } = require('tap')
const { through } = require('mississippi')

const Dir = Tacks.Dir
const File = Tacks.File
const CACHE = require('./util/test-dir')(__filename)

const packDir = require('../lib/util/pack-dir')

test('packs a directory into a valid tarball', t => {
  const manifest = {
    name: 'foo',
    version: '1.2.3'
  }
  const fixture = new Tacks(Dir({
    'package.json': File(manifest),
    'index.js': File('true === false\n')
  }))
  fixture.create(CACHE)
  let entries = {}
  const target = through()
  const extractor = tar.t()
  extractor.on('entry', (entry) => {
    let data = ''
    entry.on('end', () => {
      entries[entry.path] = data
    })
    entry.on('data', d => { data += d })
  })
  const pack = packDir(manifest, CACHE, CACHE, target)
  return Promise.all([pipe(target, extractor), pack]).then(() => {
    t.deepEqual(entries, {
      'package/package.json': JSON.stringify(manifest),
      'package/index.js': 'true === false\n'
    })
  })
})
