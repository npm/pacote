'use strict'

var url = require('url')

// Called a nerf dart in the main codebase. Used as a "safe"
// key when fetching registry info from config.
module.exports = registryKey
function registryKey (registry) {
  var parsed = url.parse(registry)
  var formatted = url.format({
    host: parsed.host,
    path: parsed.path,
    slashes: parsed.slashes
  })
  return url.resolve(formatted, '.')
}
