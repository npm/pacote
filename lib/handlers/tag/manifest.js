var manifestCache = require('../../cache/manifest')
var regManifest = require('../../registry/manifest')

module.exports = manifest
function manifest (spec, opts, cb) {
  regManifest(spec, opts, function (err, manifest, registry) {
    if (err) { return cb(err) }
    // Since we're fetching and caching a tag, we need to do a bit of extra
    // work, and make sure the *version* is also cached.
    var uri = regManifest.url(
      registry, spec.escapedName, manifest.version)
    opts.log.silly('manifest', 'memoizing additional tag entry for ', uri)
    manifestCache.put('registry', uri, manifest, {
      // by omitting `cache`, this should be future-proof against
      // excessive caching. We just want to *memoize*.
      log: opts.log
    }, function (err) {
      if (err) { return cb(err) }
      cb(null, manifest)
    })
  })
}
