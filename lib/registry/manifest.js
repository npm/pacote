'use strict'

var optCheck = require('../util/opt-check')
var pickManifest = require('./pick-manifest')
var pickRegistry = require('./pick-registry')
var url = require('url')
var request = require('./request')

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
      // Done here instead of ./finalize-manifest because these fields
      // have to be filled in differently depending on type.
      manifest._shasum = (
        manifest.dist && manifest.dist.shasum
      ) || manifest._shasum
      manifest._resolved = (
        manifest.dist && manifest.dist.tarball
      ) || url.resolve(
        registry,
        '/' + manifest.name +
        '/-/' + manifest.name +
        '-' + manifest.version +
        '.tgz'
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
