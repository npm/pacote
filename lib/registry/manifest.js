var cacheKey = require('../util/cache-key')
var optCheck = require('../util/opt-check')
var pickRegistry = require('./pick-registry')
var registryKey = require('./registry-key')
var url = require('url')

var memoizedManifests = {}

module.exports = manifest
function manifest (spec, opts, cb) {
  opts = optCheck(opts)
  opts.log.verbose('manifest', 'looking up registry-based manifest for ', spec)
  pickRegistry(spec, opts, function (err, registry) {
    if (err) { return cb(err) }
    var uri = manifestUrl(registry, spec.escapedName, spec.spec)
    if (memoizedManifests[uri]) {
      opts.log.silly('manifest', uri, 'already memoized.')
      return cb(null, memoizedManifests[uri])
    } else if (opts.cache) {
      fetchFromCache(uri, registry, opts, function (err, data) {
        if (err) {
          cb(err)
        } else if (data) {
          opts.log.silly('manifest', 'manifest for ', uri, 'found in cache')
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
  opts.log.silly('manifest', 'fetching', uri, 'from cache at', opts.cache)
  var cacache = require('cacache')
  var key = cacheKey('registry', uri)
  cacache.get.info(opts.cache, key, function (err, info) {
    if (err) { return cb(err) }
    cb(null, info && info.metadata)
  })
}

function fetchFromRegistry (uri, registry, opts, cb) {
  opts.log.silly('manifest', 'fetching', uri, 'from registry.')
  var client = new (require('npm-registry-client'))(opts)
  client.get(uri, {
    auth: opts.auth && opts.auth[registryKey(registry)]
  }, function (err, data) {
    memoizedManifests[uri] = data
    data && opts.log.silly('manifest', 'found', uri, 'in registry.')
    cb(err, data)
  })
}

module.exports._clearMemoized = function () { memoizedManifests = {} }
