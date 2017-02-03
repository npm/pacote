var manifest = require('./manifest')
var optCheck = require('../util/opt-check')
var pickRegistry = require('./pick-registry')
var pipe = require('mississippi').pipe
var request = require('./request')
var through = require('mississippi').through

module.exports = tarball
function tarball (spec, opts) {
  opts = optCheck(opts)
  var registry = pickRegistry(spec, opts)
  opts.log.verbose(
    'registry.tarball',
    'looking up registry-based metadata for ', spec
  )
  var stream = through()
  manifest(spec, opts, function (err, manifest) {
    if (err) { return stream.emit('error', err) }
    opts.log.silly(
      'registry.tarball',
      'registry metadata found. Downloading ', manifest.name + '@' + manifest.version
    )
    pipe(
      fromManifest(manifest, registry),
      stream
    )
  })
  return stream
}

module.exports.fromManifest = fromManifest
function fromManifest (manifest, registry, opts) {
  opts = optCheck(opts)
  var uri = manifest.dist && manifest.dist.tarball
  opts.digest = manifest.dist && manifest.dist.shasum
  return request.stream(uri, registry, opts)
}
