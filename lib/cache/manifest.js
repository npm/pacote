var cacache = require('cacache')
var cacheKey = require('./cache-key')

var memoizedManifests = {}

module.exports.get = getManifest
function getManifest (type, identifier, opts, cb) {
  var key = cacheKey(type, identifier)
  if (memoizedManifests[key]) {
    opts.log.silly('manifest', key, 'already memoized.')
    return cb(null, memoizedManifests[key])
  } else if (opts.cache) {
    opts.log.silly('manifest', 'fetching', key, 'from cache at', opts.cache)
    cacache.get.info(opts.cache, key, function (err, info) {
      if (err) { return cb(err) }
      if (!info) {
        err = new Error(key + ' not found in cache')
        err.code = 'ENOENT'
        err.key = key
        return cb(err)
      }
      memoizedManifests[key] = info.metadata
      cb(null, info.metadata)
    })
  } else {
    var err = new Error(key + ' not found in cache')
    err.code = 'ENOENT'
    err.key = key
    cb(err)
  }
}

module.exports.put = putManifest
function putManifest (type, identifier, manifest, opts, cb) {
  var key = cacheKey(type, identifier)
  memoizedManifests[key] = manifest
  // We don't insert manifests into the cache rn. Just memoize.
  // The manifest will be cached with the tarball if/when it gets fetched.
  cb(null)
}

module.exports._clearMemoized = function () {
  memoizedManifests = {}
}
