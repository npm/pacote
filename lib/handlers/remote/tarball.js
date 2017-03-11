'use strict'

const request = require('../../registry/request')
const url = require('url')

module.exports = tarball
function tarball (spec, opts) {
  const uri = spec._resolved || spec.spec
  const parsed = url.parse(uri)
  return request.stream(uri, {
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    pathname: parsed.pathname
  }, opts)
}

module.exports.fromManifest = fromManifest
function fromManifest (manifest, spec, opts) {
  return tarball(manifest || spec, opts)
}
