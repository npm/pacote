var getFromRegistry = require('../../registry/get')
var optCheck = require('../../util/opt-check')
var pickManifest = require('../../registry/pick-manifest')
var pickRegistry = require('../../registry/pick-registry')
var url = require('url')

module.exports = manifest
function manifest (spec, opts, cb) {
  opts = optCheck(opts)

  var registry = pickRegistry(spec, opts)
  var uri = metadataUrl(registry, spec.escapedName)

  opts.log.verbose('metadata', 'looking up registry-based metadata for ', spec)
  getFromRegistry(uri, registry, opts, function (err, metadata) {
    if (err) { return cb(err) }
    opts.log.silly('metadata', 'got metadata for', spec.name, metadata)
    pickManifest(metadata, spec, {
      engineFilter: opts.engineFilter,
      defaultTag: opts.defaultTag
    }, cb)
  })
}

function metadataUrl (registry, name) {
  // Literally the URL you make a req to to get a version-specific pkg.
  var normalized = registry.slice(-1) !== '/'
  ? registry + '/'
  : registry
  return url.resolve(normalized, name)
}
