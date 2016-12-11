var versionManifest = require('../version/manifest')

module.exports = manifest
function manifest (spec, opts, cb) {
  versionManifest(spec, opts, function (err, manifest, registry) {
    if (err) { return cb(err) }
    // Since we're fetching and caching a tag, we need to do a bit of extra
    // work, and make sure the *version* is also cached.
    // TODO - reimplement this
    cb(null, manifest, registry)
  })
}
