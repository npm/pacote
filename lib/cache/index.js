var cacache = require('cacache')
var cacheKey = require('./cache-key')
var finished = require('mississippi').finished
var through = require('mississippi').through

var HASH = 'sha1'

module.exports.key = cacheKey

var MEMOIZED = {}

module.exports._clearMemoized = clearMemoized
function clearMemoized () {
  MEMOIZED = {}
}

module.exports.put = putData
function putData (cache, key, data, opts, cb) {
  MEMOIZED[cache + ':' + key] = {
    data: data,
    meta: opts.metadata
  }
  var dummy = through()
  dummy.write(data)
  dummy.end()
  putStream(cache, key, opts)
  cacache.put.stream(cache, key, dummy, opts, cb)
}

module.exports.put.stream = putStream
function putStream () {
  // TODO
}

module.exports.get = getData
function getData (cache, key, opts, cb) {
  var metadata
  var data = ''
  var stream = getStream(
    cache, key, opts
  ).on('metadata', function (m) {
    metadata = m
  }).on('data', function (d) {
    data += d
  })
  finished(stream, function (err) {
    cb(err, data, metadata)
  })
}

module.exports.get.stream = getStream
function getStream (cache, key, opts) {
  var memoed = MEMOIZED[cache + ':' + key]
  var stream
  if (memoed) {
    opts.log.silly('cache.get', key, 'already memoized.')
    stream = through()
    stream.on('newListener', function (ev, cb) {
      ev === 'metadata' && cb(memoed.meta)
    })
    stream.write(memoed.data)
    stream.end()
    return stream
  } else {
    return cacache.get.stream(cache, key, {
      hashAlgorithm: HASH
    })
  }
}
