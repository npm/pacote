'use strict'

const util = require('util')

const fs = require('fs')
const mkdirp = util.promisify(require('mkdirp'))
const path = require('path')
const { test } = require('tap')
const tar = require('tar-stream')
const zlib = require('zlib')

const manifest = require('../manifest')

const CACHE = require('./util/test-dir')(__filename)

const writeFile = util.promisify(fs.writeFile)

test('support package.json with Byte Order Mark (BOM)', t => {
  const extract = tar.extract()
  let data = ''
  extract.on('entry', (header, stream, next) => {
    stream.on('data', (chunk) => {
      if (header.name === 'package/package.json') {
        data += chunk
      }
    })
    stream.on('end', () => next())
    stream.resume()
  })

  extract.on('finish', function () {
    const PKG = path.join(CACHE, 'package')
    mkdirp(PKG).then(() => {
      // Prepend a BOM to the json data here instead of creating a fixture.
      const bomdata = '\ufeff' + data
      writeFile(path.join(PKG, 'package.json'), bomdata).then(() => {
        t.resolves(manifest(PKG), 'successfully read package.json with Byte Order Mark (BOM)')
        t.end()
      })
    })
  })

  fs.createReadStream(path.join(CACHE, '../../fixtures/no-shrinkwrap.tgz'))
    .pipe(zlib.createGunzip())
    .pipe(extract)
})
