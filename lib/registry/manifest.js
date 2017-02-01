var request = require('./request')
var optCheck = require('../util/opt-check')
var pickManifest = require('./pick-manifest')
var pickRegistry = require('./pick-registry')
var url = require('url')

module.exports = manifest
function manifest (spec, opts, cb) {
  opts = optCheck(opts)
  opts.memoize = true

  var registry = pickRegistry(spec, opts)
  var uri = metadataUrl(registry, spec.escapedName)

  opts.log.verbose(
    'registry.manifest',
    'looking up registry-based metadata for ', spec
  )
  request(uri, registry, opts, function (err, metadata) {
    if (err) { return cb(err) }
    opts.log.silly('registry.manifest', 'got metadata for', spec.name)
    pickManifest(metadata, spec, {
      engineFilter: opts.engineFilter,
      defaultTag: opts.defaultTag
    }, function (err, manifest) {
      if (err) { return cb(err) }
      opts.log.silly(
        'registry.manifest',
        spec.name + '@' + spec.spec,
        'resolved to',
        manifest.name + '@' + manifest.version
      )
      cb(null, manifest)
    })
  })
}

function metadataUrl (registry, name) {
  var normalized = registry.slice(-1) !== '/'
  ? registry + '/'
  : registry
  return url.resolve(normalized, name)
}
