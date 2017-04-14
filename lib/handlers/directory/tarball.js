'use strict'

const BB = require('bluebird')

const manifest = require('./manifest')
const packDir = require('../../util/pack-dir')
const through = require('mississippi').through
const pipe = BB.promisify(require('mississippi').pipe)

module.exports = tarball
function tarball (spec, opts) {
  const stream = through()
  manifest(spec, opts).then(mani => {
    return pipe(fromManifest(mani, spec, opts), stream)
  }).catch(err => stream.emit('error', err))
  return stream
}

module.exports.fromManifest = fromManifest
function fromManifest (manifest, spec, opts) {
  const stream = through()
  packDir(manifest, manifest._resolved, manifest._resolved, stream, opts).catch(err => {
    stream.emit('error', err)
  })
  return stream
}
