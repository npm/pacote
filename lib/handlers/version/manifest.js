var regManifest = require('../../registry/manifest')

module.exports = manifest
function manifest (spec, opts, cb) {
  regManifest(spec, opts, cb)
}
