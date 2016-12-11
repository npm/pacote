var getFromRegistry = require('../../registry/get')
var optCheck = require('../../util/opt-check')
var pickRegistry = require('../../registry/pick-registry')
var url = require('url')

module.exports = manifest
function manifest (spec, opts, cb) {
  opts = optCheck(opts)

  var registry = pickRegistry(spec, opts)
  var uri = manifestUrl(registry, spec.escapedName, spec.spec)

  opts.log.verbose('manifest', 'looking up registry-based metadata for ', spec)
  getFromRegistry(uri, registry, opts, function (err, manifest) {
    if (err) { return cb(err) }
    opts.log.silly('manifest', 'got manifest for', spec.name, manifest)
    cb(null, manifest)
  })
}

function manifestUrl (registry, name, version) {
  // Literally the URL you make a req to to get a version-specific pkg.
  var normalized = registry.slice(-1) !== '/'
  ? registry + '/'
  : registry
  return url.resolve(
    normalized, name + '/' + version)
}
