var cacache = require('cacache')
var cacheKey = require('../cache/cache-key')
var client = require('./client')
var dezalgo = require('dezalgo')
var inflight = require('inflight')
var fs = require('fs')
var path = require('path')
var registryKey = require('./registry-key')

var MEMOIZED = {}

module.exports = get
function get (uri, registry, opts, cb) {
  var key = cacheKey('registry-request', uri)
  cb = dezalgo(cb)
  cb = inflight(key, cb)
  if (!cb) {
    opts.log.silly('registry', key, 'is already inflight')
    return
  }
  tryFromCache(key, opts, function (err, cachedBody, meta) {
    if (err && err.code !== 'ENOENT') { return cb(err) }
    if (cachedBody && !meta) {
      // Memoized. Not even bothering to check for updates.
      return cb(null, cachedBody)
    } else if (cachedBody && !isStale(meta, opts)) {
      // Cached, and not stale.
      MEMOIZED[key] = cachedBody
      return cb(null, cachedBody)
    } else {
      // Stale cache, or cache miss.

      // Lazy-load npm-registry-client cause it's a bit of a cow.
      client(opts).get(uri, {
        etag: meta && meta.etag,
        lastModified: meta && meta.lastModified,
        follow: opts.follow,
        auth: opts.auth && opts.auth[registryKey(registry)]
      }, function (err, body, raw, res) {
        if (err && cachedBody) {
          opts.log.silly('registry', 'request error. Using', key, 'from cache.')
          return cb(null, cachedBody)
        } else if (err) {
          return cb(err)
        } else {
          var etag = res.headers['ETag']
          var lastMod = res.headers['Last-Modified']
          opts.log.silly('registry', 'inserting', key, 'into cache.')
          putInCache(opts.cache, key, etag, lastMod, body, raw, cb)
        }
      })
    }
  })
}

function isStale (meta, opts) {
  if (opts.staleOk || !opts.timeout) {
    return false
  } else {
    return ((new Date() - meta.time) / 1000) > opts.timeout
  }
}

function tryFromCache (key, opts, cb) {
  if (MEMOIZED[key]) {
    opts.log.silly('registry', key, 'already memoized.')
    return cb(null, MEMOIZED[key])
  } else if (!opts.cache) {
    opts.log.silly('registry', key, 'not memoized, no cache available.')
    return cb(null)
  } else {
    cacache.get.info(opts.cache, key, function (err, info) {
      if (err) { return cb(err) }
      if (!info || !info.path) {
        opts.log.silly('registry', key, 'not found in cache')
        err = new Error('not found')
        err.code = 'ENOENT'
        return cb(err)
      }
      var filePath = path.resolve(opts.cache, info.path)
      fs.readFile(filePath, 'utf8', function (err, json) {
        var data
        try {
          data = JSON.parse(json)
        } catch (e) {}
        opts.log.silly('registry', key, 'fetched from cache.')
        return cb(err, data, info.metadata)
      })
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
