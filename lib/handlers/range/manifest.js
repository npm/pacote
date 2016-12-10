var asyncMap = require('slide').asyncMap
var inflight = require('inflight')
var manifestCache = require('../cache/manifest')
var optCheck = require('../../util/opt-check')
var pickRegistry = require('../../registry/pick-registry')
var registryKey = require('../../registry/registry-key')
var semver = require('semver')
var url = require('url')

module.exports = manifest
function manifest (spec, opts, cb) {
  opts = optCheck(opts)
  opts.log.verbose('metadata', 'looking up registry-based metadata for ', spec)

  var registry = pickRegistry(spec, opts)
  var uri = metadataUrl(registry, spec.escapedName)

  cb = inflight('pacote registry metadata req: ' + uri, cb)
  if (!cb) {
    opts.log.silly('manifest', 'request for', uri, 'inflight. Stepping back.')
    return
  }
}

function metadataUrl (registry, name) {
  // Literally the URL you make a req to to get a version-specific pkg.
  var normalized = registry.slice(-1) !== '/'
  ? registry + '/'
  : registry
  return url.resolve(normalized, name)
}
