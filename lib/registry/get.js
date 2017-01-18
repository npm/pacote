var cache = require('../cache')
var dezalgo = require('dezalgo')
var finished = require('mississippi').finished
var inflight = require('inflight')
var pipe = require('mississippi').pipe
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
  var data = ''
  var stream = getStream(uri, registry, opts)
  stream.on('data', function (d) { data += d })
  stream.on('reset', function () { data = null })
  finished(stream, function (err) {
    return cb(err, data)
  })
}

// Returns a stream of data from `uri` in `registry`.
//
// The stream emits the following events:
//
// * `data` - standard data event, representing the raw data
//          for `uri`.
// * `error` - final error state. No more data will be transferred.
// * `reset` - if this event is signaled, client must clear out any
//             state from previous `data` events, and continue
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

  if (!opts.cache) {
    opts.log.silly('registry.get', 'no cache option. skipping cache fetch')
    switchToRegistry(null, null)
  } else {
    var cs = cache.get.stream(opts.cache, key, opts)
    cs.on('reset', function () { stream.emit('reset') })
    cs.on('metadata', function (meta) {
      if (isStale(meta, opts)) {
        opts.log.silly(
          'registry.get',
          'cache data for', key, 'stale. Checking registry.'
        )
        cs.pause()
        switchToRegistry(null, cs, meta)
      }
    })
    cs.once('error', function (err) {
      opts.log.silly('registry.get', 'error while streaming from cache:', err)
      switchToRegistry(err, null)
    })
    cs.pipe(stream)
    stream.on('error', function (e) { cs.emit('error', e) })
    stream.on('end', function () { cs.end() })
  }

  function switchToRegistry (err, fallback, meta) {
    if (opts.offline) {
      opts.log.silly(
        'registry.get',
        'offline mode enforced for',
        key
      )
      if (fallback) {
        opts.log.silly('registry.get', 'resuming stale cache stream for', key)
        cs.resume()
      } else {
        if (!err) {
          err = new Error('no offline data available')
          err.code = 'ENOENT'
        }
        return stream.emit('error', err)
      }
    } else {
      if (fallback) {
        stream.emit('reset')
      }
      registryStream(
        key, uri, registry, meta, opts
      ).on('reset', function () {
        stream.emit('reset')
      }).on('cached', function () {
        opts.log.silly('registry.get', 'Got a 304. Switching back to cache.')
        fallback.resume()
      }).once('error', function (err) {
        opts.log.silly('registry.get', 'request error: ', err)
        if (!fallback) {
          stream.emit('error', err)
        } else {
          opts.log.silly('registry.get', 'using stale', key, 'from cache.')
          fallback.resume()
        }
      }).on('end', function () {
        stream.end()
      }).pipe(stream)
    }
  }

  return stream
}

function isStale (meta, opts) {
  if (!opts.maxAge || opts.preferOffline || opts.offline) {
    opts.log.silly('registry.get', 'skipping staleness check for')
    return false
  } else {
    return ((new Date() - meta.time) / 1000) > opts.maxAge
  }
}

module.exports._registryStream = registryStream
function registryStream (key, uri, registry, meta, opts) {
  var stream = through()
  client(opts).get(uri, {
    etag: meta && meta.etag,
    lastModified: meta && meta.lastModified,
    follow: opts.follow,
    auth: opts.auth && opts.auth[registryKey(registry)],
    timeout: opts.timeout,
    streaming: true
  }, function (err, res) {
    if (err) {
      stream.emit('error', err)
    } else if (res.statusCode === 304) {
      opts.log.silly('registry.get', 'cached data valid')
      res.on('data', function () {}) // Just drain it
      stream.emit('cached')
      stream.end()
    } else {
      opts.log.silly('registry.get', 'request successful. streaming data')
      pipe(
        res,
        cache.put.stream(opts.cache, key, {
          metadata: {
            etag: res.headers['ETag'],
            lastModified: res.headers['Last-Modified']
          }
        }),
        stream,
        function () {}
      )
    }
  })
  return stream
}

var CLIENT
var CLIENT_OPTS

module.exports = client
function client (opts) {
  if (!CLIENT ||
      CLIENT_OPTS.log !== opts.log ||
      CLIENT_OPTS.retry !== opts.retry) {
    var RegistryClient = require('npm-registry-client')
    CLIENT_OPTS = {
      log: opts.log,
      retry: opts.retry
    }
    CLIENT = new RegistryClient(CLIENT_OPTS)
  }
  return CLIENT
}
