var getFromRegistry = require('./get')
var optCheck = require('../util/opt-check')
var pickManifest = require('./pick-manifest')
var pickRegistry = require('./pick-registry')
var finished = require('mississippi').finished
var url = require('url')

module.exports = manifest
function manifest (spec, opts, cb) {
  opts = optCheck(opts)

  var registry = pickRegistry(spec, opts)
  var uri = metadataUrl(registry, spec.escapedName)

  opts.log.verbose(
    'registry.manifest',
    'looking up registry-based metadata for ', spec
  )
  getFromRegistry(uri, registry, opts, function (err, metadata) {
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
      ensureShrinkwrap(registry, manifest, opts, cb)
    })
  })
}

function metadataUrl (registry, name) {
  var normalized = registry.slice(-1) !== '/'
  ? registry + '/'
  : registry
  return url.resolve(normalized, name)
}

var fetchStream
function ensureShrinkwrap (registry, manifest, opts, cb) {
  if (
    !opts.requireShrinkwrap ||
    manifest.hasShrinkwrap !== true ||
    manifest._shrinkwrap != null
  ) {
    // Already have shrinkwrap data, or we know we don't need it.
    cb(null, manifest)
  } else {
    // Have to download the whole tarball just to get shrinkwrap :(
    if (!fetchStream) { fetchStream = require('./fetch-stream') }
    finished(fetchStream(manifest, opts), function (err) {
      // `fetchStream` writes straight to the manifest given
      // so this one will have shrinkwrap data at this point.
      cb(err, manifest)
    })
  }
}
