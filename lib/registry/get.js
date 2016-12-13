var cacache = require('cacache')
var cache = require('../cache')
var client = require('./client')
var dezalgo = require('dezalgo')
var inflight = require('inflight')
var registryKey = require('./registry-key')

var MEMOIZED = {}

module.exports = get
function get (uri, registry, opts, cb) {
  var key = cache.key('registry-request', uri)
  cb = dezalgo(cb)
  cb = inflight(key, cb)
  if (!cb) {
    opts.log.silly('registry.get', key, 'is already inflight')
    return
  }
  tryFromCache(key, opts, function (err, cachedBody, meta) {
    if (err && err.code !== 'ENOENT') { return cb(err) }
    if (cachedBody && !meta) {
      // Memoized. Not even bothering to check for updates.
      opts.log.silly('registry.get', key, 'already memoized')
      return cb(null, cachedBody)
    } else if (cachedBody && !isStale(key, meta, opts)) {
      opts.log.silly('registry.get', 'cached data not stale for', key)
      // Cached, and not stale.
      MEMOIZED[key] = cachedBody
      return cb(null, cachedBody)
    } else {
      // Stale cache, or cache miss.
      if (cachedBody && (opts.offline || opts.preferOffline)) {
        opts.log.silly(
          'registry.get',
          'offline mode active. returning stale cache data'
        )
        return cb(null, cachedBody, meta)
      } else if (!cachedBody && opts.offline) {
        opts.log.silly('registry.get', 'offline enforced, and no data for', key)
        err = new Error('offline data not cached')
        err.code = 'ENOENT'
        return cb(err)
      } else {
        opts.log.silly('registry.get', 'fetching', key, 'from registry')
        tryFromRegistry(uri, key, registry, cachedBody, meta, opts, cb)
      }
    }
  })
}

function isStale (key, meta, opts) {
  if (opts.staleOk || !opts.timeout) {
    opts.log.silly('registry.get', 'skipping staleness check for', key)
    return false
  } else {
    return ((new Date() - meta.time) / 1000) > opts.timeout
  }
}

function tryFromCache (key, opts, cb) {
  if (MEMOIZED[key]) {
    opts.log.silly('registry.get', key, 'already memoized.')
    return cb(null, MEMOIZED[key])
  } else if (!opts.cache) {
    opts.log.silly('registry.get', key, 'not memoized, no cache available.')
    return cb(null)
  } else {
    cache.get(opts.cache, key, function (err, json, meta) {
      if (err && err.code === 'ENOENT') { return cb(null) }
      if (err) { return cb(err) }
      var data
      try {
        data = JSON.parse(json)
      } catch (e) {
        opts.log.silly('registry.get', 'cached data for', key, 'corrupted.')
        // Just skip and continue. This should be very *very* rare because of
        // checksum verification for cache entries.
        return cb(null)
      }
      opts.log.silly('registry.get', 'found cached data for', key)
      return cb(err, data, meta || {}) // meta used to check for memoization
    })
  }
}

function putInCache (cache, key, etag, lastMod, body, raw, cb) {
  MEMOIZED[key] = body
  if (!cache) { return cb(null, body) }
  cacache.put.data(cache, key, '', raw, {
    metadata: { etag: etag, lastMod: lastMod }
  }, function (err) {
    cb(err, body)
  })
}

module.exports._clearMemoized = clearMemoized
function clearMemoized () {
  MEMOIZED = {}
}

function tryFromRegistry (uri, key, registry, cachedBody, meta, opts, cb) {
  client(opts).get(uri, {
    etag: meta && meta.etag,
    lastModified: meta && meta.lastModified,
    follow: opts.follow,
    auth: opts.auth && opts.auth[registryKey(registry)]
  }, function (err, body, raw, res) {
    if (err && cachedBody) {
      opts.log.silly('registry.get', 'request error. Using', key, 'from cache.')
      return cb(null, cachedBody)
    } else if (err) {
      return cb(err)
    } else {
      var etag = res.headers['ETag']
      var lastMod = res.headers['Last-Modified']
      opts.log.silly('registry.get', 'inserting', key, 'into cache.')
      putInCache(opts.cache, key, etag, lastMod, body, raw, cb)
    }
  })
}
