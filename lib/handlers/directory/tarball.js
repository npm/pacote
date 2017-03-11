'use strict'

module.exports = tarballNope
module.exports.fromManifest = tarballNope

function tarballNope () {
  throw new Error('local directory packages have no tarball data')
}
