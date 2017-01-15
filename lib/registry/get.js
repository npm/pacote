var cache = require('../cache')
var client = require('./client')
var dezalgo = require('dezalgo')
var finished = require('mississippi').finished
var inflight = require('inflight')
var registryKey = require('./registry-key')
var through = require('mississippi').through

module.exports = get
function get (uri, registry, opts, cb) {
  var key = cache.key('registry-request', uri)
  cb = dezalgo(cb)
  cb = inflight(key, cb)
  if (!cb) {
    opts.log.silly('registry.get', key, 'is already inflight')
    return
  }
  var metadata
  var data
  var stream = getStream(uri, registry, opts)
  stream.on('metadata', function (meta) { metadata = meta })
  stream.on('data', function (d) {
    if (opts.json) {
      data = d
    } else {
      data += d
    }
  })
  stream.on('reset', function () {
    metadata = null
    data = null
  })
  finished(stream, function (err) {
    return cb(err, data, metadata)
  })
}

// Returns a stream of data from `uri` in `registry`.
//
// The stream emits the following events:
//
// * `data` - standard data event, representing the raw data
//          for `uri`.
// * `error` - final error state. No more data will be transferred.
// * `metadata` - emitted as soon as metadata about this uri is available.
// * `reset` - if this event is signaled, client must clear out any
//             state from previous `data` and `metadata` events, and continue
//             consuming from the same stream. This usually happens in the case
//             of network errors (where we might retry multiple times), or
//             in the case of cache staleness or error states.
//             If you need reliable, single-event output, use the non-stream
//             version of `get` instead.
// * `end` - emitted once, upon *successful* stream completion.
//
module.exports.stream = getStream
function getStream (uri, registry, opts) {
  var key = cache.key('registry-request', uri)
  var stream = opts.json ? through.obj() : through()

  var cacheStream = tryFromCache(
    key, opts
  ).on('metadata', function (meta) {
    var stale = isStale(key, meta, opts)
    if (stale && (opts.preferOffline || opts.offline)) {
      opts.log.silly('registry.get', 'using stale data due to offline opts')
      stream.emit('metadata', meta)
    } else if (stale) {
      opts.log.silly('registry.get', 'cached data stale for', key)
      cacheStream.emit('error', new Error('cache data stale'))
    } else {
      opts.log.silly('registry.get', 'cached data still up to date for', key)
      stream.emit('metadata', meta)
    }
  }).on('error', function (err) {
    opts.log.verbose('registry.get', 'error while streaming from cache:', err)
    // TODO - clear the cache unless it's a staleness issue
    switchToRegistry(err)
  }).pipe(stream)

  function switchToRegistry (err) {
    if (!cacheStream) { return }
    cacheStream.unpipe(stream)
    cacheStream = null // TODO - use `once` here instead of this nonsense.
    if (opts.offline) {
      opts.log.silly(
        'registry.get',
        'offline mode enforced, and no cached data for',
        key
      )
      if (!err) {
        err = new Error('offline data not cached')
        err.code = 'ENOENT'
      }
      return stream.emit('error', err)
    } else {
      stream.emit('reset')
      // TODO
      tryFromRegistry(
        uri, key
      ).pipe(stream)
    }
  }

  return stream

  tryFromCache(key, opts, function (err, cachedBody, meta) {
    if (err && err.code !== 'ENOENT') {
      return cb(err)
    } else if (cachedBody && !isStale(key, meta, opts)) {
      opts.log.silly('registry.get', 'cached data not stale for', key)
      return cb(null, cachedBody)
    } else if (cachedBody && (opts.offline || opts.preferOffline)) {
      // Stale cache, or cache miss.
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
  if (opts.json) {
    // TODO!!
    stream = pipeline(
      jsonstream.parse(typeof opts.json === 'string' ? opts.json : undefined),
      stream
    )
  }
  if (!opts.cache) {
    opts.log.silly('registry.get', 'no cache option. skipping cache fetch')
    return cb(null)
  }
  cache.get(opts.cache, key, opts, function (err, json, meta) {
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

function putInCache (cachePath, key, etag, lastMod, body, raw, cb) {
  if (!cachePath) { return cb(null, body) }
  cache.put(cachePath, key, raw, {
    metadata: { etag: etag, lastMod: lastMod }
  }, function (err) {
    cb(err, body)
  })
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
      if (cachedBody && res.statusCode === 304) {
        body = cachedBody
        raw = JSON.stringify(cachedBody)
      }
      var etag = res.headers['ETag']
      var lastMod = res.headers['Last-Modified']
      opts.log.silly('registry.get', 'inserting', key, 'into cache.')
      putInCache(opts.cache, key, etag, lastMod, body, raw, cb)
    }
  })
}
