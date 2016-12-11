var inflight = require('inflight')
var optCheck = require('../../util/opt-check')
var pickManifest = require('./pick-manifest')
var pickRegistry = require('../../registry/pick-registry')
var registryKey = require('../../registry/registry-key')
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

  fetchFromRegistry(uri, registry, opts, function (err, metadata) {
    if (err) { return cb(err) }
    opts.log.silly('metadata', 'got metadata for', spec.name, metadata)
    pickManifest(metadata, spec.spec, {
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

function fetchFromRegistry (uri, registry, opts, cb) {
  opts.log.silly('metadata', 'fetching', uri, 'from registry.')
  var client = new (require('npm-registry-client'))({
    log: opts.log,
    retry: opts.retry
  })
  client.get(uri, {
    auth: opts.auth && opts.auth[registryKey(registry)]
  }, cb)
}
