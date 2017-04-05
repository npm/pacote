'use strict'

const registryTarball = require('../../registry/tarball')

module.exports = tarball
function tarball (spec, opts) {
  const uri = spec._resolved || spec.spec
  return registryTarball.fromManifest({
    _resolved: uri,
    _integrity: opts.integrity
  }, spec, opts)
}

module.exports.fromManifest = fromManifest
function fromManifest (manifest, spec, opts) {
  return tarball(manifest || spec, opts)
}
