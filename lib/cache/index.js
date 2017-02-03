var cacache = require('cacache')
var cacheKey = require('./cache-key')
var finished = require('mississippi').finished
var through = require('mississippi').through
var pipe = require('mississippi').pipe
var pipeline = require('mississippi').pipeline

var HASH = 'sha1'

module.exports.key = cacheKey

var MEMOIZED = {}

module.exports._clearMemoized = clearMemoized
function clearMemoized () {
  var old = MEMOIZED
  MEMOIZED = {}
  return old
}

module.exports.memoize = memoize
function memoize (key, data) {
  MEMOIZED[key] = data
}

module.exports.readMemoized = readMemoized
function readMemoized (key) {
  return MEMOIZED[key]
}

module.exports.put = putData
function putData (cache, key, data, opts, cb) {
  if (!cb) {
    cb = opts
    opts = null
  }
  opts = opts || {}
  var put = putStream(cache, key, opts)
  var dummy = through()
  pipe(dummy, put, function (err) {
    cb(err)
  })
  dummy.write(data)
  dummy.end()
}

module.exports.put.stream = putStream
function putStream (cache, key, opts) {
  // This is the most ridiculous thing, but cacache
  // needs an API overhaul, and I need to think longer
  // about whether to emit the index entry...
  var dest = cacache.put.stream(cache, key, opts)
  var lol = through()
  var piped = pipeline(lol, dest)
  var meta
  dest.on('metadata', function (m) {
    meta = m.metadata
    piped.emit('metadata', m.metadata)
  })
  dest.on('digest', function (d) {
    piped.emit('digest', d)
  })
  dest.on('end', function () {
    opts.log.silly('cache.put', 'finished writing cache data for', key)
  })
  if (opts.memoize) {
    opts.log.silly('cache.put', 'memoization of', key, 'requested')
    var data = ''
    lol.on('data', function (d) {
      data += d
    })
    finished(piped, function (err) {
      if (err) { return }
      opts.log.silly('cache.put', key, 'memoized')
      MEMOIZED[cache + ':' + key] = {
        data: data,
        meta: meta || null
      }
    })
  }
  return piped
}

module.exports.get = getData
function getData (cache, key, opts, cb) {
  if (!cb) {
    cb = opts
    opts = null
  }
  opts = opts || {}
  var meta
  var data = ''
  var stream = getStream(
    false, cache, key, opts
  ).on('metadata', function (m) {
    meta = m
  }).on('data', function (d) {
    data += d
  })
  finished(stream, function (err) {
    cb(err, data, meta)
  })
}

module.exports.get.stream = function (cache, key, opts) {
  return getStream(false, cache, key, opts)
}
module.exports.get.stream.byDigest = function (cache, digest, opts) {
  return getStream(true, cache, digest, opts)
}
function getStream (byDigest, cache, key, opts) {
  opts = opts || {}
  var stream
  if (!cache || !key) {
    stream = through()
    var err = new Error('no cache or key')
    err.code = 'ENOENT'
    setImmediate(function () { stream.emit('error', err) })
    return stream
  }
  var memoed = MEMOIZED[cache + ':' + key]
  if (memoed) {
    opts.log && opts.log.silly('cache.get', key, 'already memoized.')
    stream = through()
    stream.on('newListener', function (ev, cb) {
      ev === 'metadata' && cb(memoed.meta)
    })
    stream.write(memoed.data)
    stream.end()
    return stream
  } else {
    var dest = through()
    var meta
    var getter = byDigest ? cacache.get.stream.byDigest : cacache.get.stream
    var src = getter(cache, key, {
      hashAlgorithm: HASH
    }).on('metadata', function (m) {
      meta = m.metadata
      piped.emit('metadata', m.metadata)
    }).on('digest', function (d) {
      piped.emit('digest', d)
    })
    var piped = pipeline(src, dest)
    if (opts.memoize) {
      var data = ''
      piped.on('data', function (d) {
        data += d
      })
      finished(piped, function (err) {
        if (err) { return }
        MEMOIZED[cache + ':' + key] = {
          data: data,
          meta: meta || null
        }
      })
    }
    return piped
  }
}
