var extractShrinkwrap = require('../util/extract-shrinkwrap')
var optCheck = require('../util/opt-check')
var pickManifest = require('./pick-manifest')
var pickRegistry = require('./pick-registry')
var url = require('url')
var request = require('./request')
var tarball = require('./tarball')

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
      ensureShrinkwrap(manifest, registry, opts, cb)
    })
  })
}

function metadataUrl (registry, name) {
  var normalized = registry.slice(-1) !== '/'
  ? registry + '/'
  : registry
  return url.resolve(normalized, name)
}

function ensureShrinkwrap (manifest, registry, opts, cb) {
  if (manifest._hasShrinkwrap === false || manifest._shrinkwrap || !manifest.dist) {
    opts.log.silly('registry.manifest', 'shrinkwrap extraction not needed')
    cb(null, manifest)
  } else {
    opts.log.silly('registry.manifest', 'extracting shrinkwrap')
    opts.memoize = false
    var shrinkwrap
    var tarstream = tarball.fromManifest(manifest, registry, opts)
    extractShrinkwrap(tarstream, opts, function (err, sr) {
      if (err) { return cb(err) }
      shrinkwrap = sr
    })
    tarstream.on('data', function () {})
    tarstream.on('error', cb)
    tarstream.on('end', function () {
      manifest._hasShrinkwrap = !!shrinkwrap
      manifest._shrinkwrap = shrinkwrap
      if (shrinkwrap) {
        opts.log.silly('registry.manifest', 'shrinkwrap found')
      } else {
        opts.log.silly('registry.manifest', 'no shrinkwrap')
      }
      cb(null, manifest)
    })
  }
}
