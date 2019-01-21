'use strict'

const BB = require('bluebird')

const fs = BB.promisifyAll(require('fs'))
const mkdirp = BB.promisify(require('mkdirp'))
const path = require('path')
const test = require('tap').test
const tar = require('tar-stream')
const zlib = require('zlib')

const manifest = require('../manifest')

const CACHE = require('./util/test-dir')(__filename)

test('support package.json with Byte Order Mark (BOM)', t => {
  var extract = tar.extract()
  var data = ''
  extract.on('entry', function (header, stream, next) {
    stream.on('data', function (chunk) {
      if (header.name === 'package/package.json') {
        data += chunk
      }
    })

    stream.on('end', function () {
      next()
    })

    stream.resume()
  })

  extract.on('finish', function () {
    let PKG = path.join(CACHE, 'package')
    mkdirp(PKG).then(() => {
      // Prepend a BOM to the json data here instead of creating a fixture.
      let bomdata = '\ufeff' + data
      fs.writeFile(path.join(PKG, 'package.json'), bomdata, function () {
        t.resolves(manifest(PKG), 'successfully read package.json with Byte Order Mark (BOM)')
        t.end()
      })
    })
  })

  fs.createReadStream(path.join(CACHE, '../../fixtures/no-shrinkwrap.tgz'))
    .pipe(zlib.createGunzip())
    .pipe(extract)
})
