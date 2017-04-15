'use strict'

const BB = require('bluebird')

const fs = require('fs')
const pipe = require('mississippi').pipe
const through = require('mississippi').through

const readFileAsync = BB.promisify(fs.readFile)
const statAsync = BB.promisify(fs.stat)

const MAX_BULK_SIZE = 2 * 1024 * 1024 // 2MB

module.exports = tarball
function tarball (spec, opts) {
  const src = spec._resolved || spec.fetchSpec
  const stream = through()
  statAsync(src).then(stat => {
    if (stat.size <= MAX_BULK_SIZE) {
      // YAY LET'S DO THING IN BULK
      return readFileAsync(src).then(data => {
        stream.write(data, () => {
          stream.end()
        })
      })
    } else {
      return pipe(fs.createReadStream(src), stream)
    }
  }, err => stream.emit('error', err))
  return stream
}

module.exports.fromManifest = fromManifest
function fromManifest (manifest, spec, opts) {
  return tarball(manifest || spec, opts)
}
