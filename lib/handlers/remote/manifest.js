'use strict'

module.exports = manifest
function manifest (spec) {
  // We can't get the manifest for a remote tarball until
  // we extract the tarball itself.
  // `finalize-manifest` takes care of this process of extracting
  // a manifest based on ./tarball.js
  return null
}
