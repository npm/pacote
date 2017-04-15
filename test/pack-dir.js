'use strict'

const BB = require('bluebird')

const pipe = BB.promisify(require('mississippi').pipe)
const Tacks = require('tacks')
const tar = require('tar-stream')
const test = require('tap').test
const through = require('mississippi').through

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
  const extractor = tar.extract()
  extractor.on('entry', (header, stream, next) => {
    let data = ''
    stream.on('data', d => { data += d })
    stream.on('end', () => {
      entries[header.name] = data
      next()
    })
  })
  const pack = packDir(manifest, CACHE, CACHE, target)
  return BB.join(pipe(target, extractor), pack, () => {
    t.deepEqual(entries, {
      'package/.': '',
      'package/package.json': JSON.stringify(manifest),
      'package/index.js': 'true === false\n'
    })
  })
})
