'use strict'

var optCheck = require('../util/opt-check')
var pickManifest = require('./pick-manifest')
var pickRegistry = require('./pick-registry')
var url = require('url')
var request = require('./request')

module.exports = manifest
function manifest (spec, opts) {
  opts = optCheck(opts)
  opts.memoize = true

  var registry = pickRegistry(spec, opts)
  var uri = metadataUrl(registry, spec.escapedName)

  opts.log.verbose(
    'registry.manifest',
    'looking up registry-based metadata for ', spec
  )
  return request(uri, registry, opts).then(metadata => {
    opts.log.silly('registry.manifest', 'got metadata for', spec.name)
    return pickManifest(metadata, spec, {
      engineFilter: opts.engineFilter,
      defaultTag: opts.defaultTag
    })
  }).then(manifest => {
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
    return manifest
  }).catch({code: 'ETARGET'}, err => {
    if (!opts.cache || opts.maxAge < 0 || opts.offline) {
      throw err
    } else {
      opts.log.silly('registry.manifest', 'version missing from current metadata, forcing network check')
      opts.maxAge = -1
      return manifest(spec, opts)
    }
  })
}

function metadataUrl (registry, name) {
  var normalized = registry.slice(-1) !== '/'
  ? registry + '/'
  : registry
  return url.resolve(normalized, name)
}
