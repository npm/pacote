var cacache = require('cacache')
var cacheKey = require('./cache-key')
var finished = require('mississippi').finished
var pipe = require('mississippi').pipe
var through = require('mississippi').through

var HASH = 'sha1'

module.exports.key = cacheKey

module.exports.get = get
function get (cache, key, cb) {
  // TODO - modify cacache to make this more straightforward.
  cacache.get.info(cache, key, function (err, info) {
    if (err) { return cb(err) }
    if (!info) {
      err = new Error('not found')
      err.code = 'ENOENT'
      return cb(err)
    } else {
      var buf = ''
      var stream = cacache.get.stream.byDigest(cache, info.digest, {
        hashAlgorithm: HASH
      })
      stream.on('data', function (d) { buf += d })
      finished(stream, function (err) {
        cb(err, buf, info.metadata)
      })
    }
  })
}
