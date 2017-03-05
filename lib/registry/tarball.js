'use strict'

var manifest = require('./manifest')
var optCheck = require('../util/opt-check')
var pickRegistry = require('./pick-registry')
var pipe = require('mississippi').pipe
var request = require('./request')
var through = require('mississippi').through

module.exports = tarball
function tarball (spec, opts) {
  opts = optCheck(opts)
  opts.log.verbose(
    'registry.tarball',
    'looking up registry-based metadata for ', spec
  )
  var stream = through()
  manifest(spec, opts).then(manifest => {
    opts.log.silly(
      'registry.tarball',
      'registry metadata found. Downloading ', manifest.name + '@' + manifest.version
    )
    pipe(
      fromManifest(manifest, spec, opts),
      stream
    )
  }, err => stream.emit('error', err))
  return stream
}

module.exports.fromManifest = fromManifest
function fromManifest (manifest, spec, opts) {
  opts = optCheck(opts)
  var registry = pickRegistry(spec, opts)
  var uri = manifest._resolved
  opts.digest = manifest._shasum
  return request.stream(uri, registry, opts)
}
