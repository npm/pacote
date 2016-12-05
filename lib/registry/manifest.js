var cacheKey = require('../util/cache-key')
var pickRegistry = require('./pick-registry')
var registryKey = require('./registry-key')
var url = require('url')

var memoizedManifests = {}

module.exports = manifest
function manifest (spec, opts, cb) {
  pickRegistry(spec, opts, function (err, registry) {
    if (err) { return cb(err) }
    var uri = manifestUrl(registry, spec.escapedName, spec.spec)
    if (memoizedManifests[uri]) {
      return cb(null, memoizedManifests[uri])
    } else if (opts.cache) {
      fetchFromCache(uri, registry, opts, function (err, data) {
        if (err) {
          cb(err)
        } else if (data) {
          cb(null, data)
        } else {
          fetchFromRegistry(uri, registry, opts, cb)
        }
      })
    } else {
      fetchFromRegistry(uri, registry, opts, cb)
    }
  })
}

function manifestUrl (registry, name, version) {
  var normalized = registry.slice(-1) !== '/'
  ? registry + '/'
  : registry
  return url.resolve(normalized, name + '/' + version)
}

function fetchFromCache (uri, registry, opts, cb) {
  var cacache = require('cacache')
  var key = cacheKey('registry', uri)
  cacache.get.info(opts.cache, key, function (err, info) {
    if (err) { return cb(err) }
    cb(null, info && info.metadata)
  })
}

function fetchFromRegistry (uri, registry, opts, cb) {
  var client = new (require('npm-registry-client'))(opts)
  client.get(uri, {
    auth: opts.auth && opts.auth[registryKey(registry)]
  }, function (err, data) {
    memoizedManifests[uri] = data
    cb(err, data)
  })
}
