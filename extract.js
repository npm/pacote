'use strict'

var cache = require('./lib/cache')
var extractStream = require('./lib/util/extract-stream')
var pipe = require('mississippi').pipe
var optCheck = require('./lib/util/opt-check')
var rps = require('realize-package-specifier')

module.exports = extract
function extract (spec, dest, opts, cb) {
  if (!cb) {
    cb = opts
    opts = null
  }
  opts = optCheck(opts)
  if (opts.digest) {
    opts.log.silly('extract', 'trying ', spec, ' digest:', opts.digest)
    extractByDigest(dest, opts, function (err) {
      if (err && err === 'ENOENT') {
        opts.log.silly('extract', 'digest for', spec, 'not present. Using manifest.')
        return extractByManifest(spec, dest, opts, cb)
      } else {
        return cb(err)
      }
    })
  } else {
    opts.log.silly('extract', 'no digest provided for ', spec, '- extracting by manifest')
    extractByManifest(spec, dest, opts, cb)
  }
}

function extractByDigest (dest, opts, cb) {
  var xtractor = extractStream(dest, opts)
  var cached = cache.get.stream.byDigest(opts.cache, opts.digest, opts)
  pipe(cached, xtractor, cb)
}

function extractByManifest (spec, dest, opts, cb) {
  var xtractor = extractStream(dest, opts)
  rps(spec, function (err, res) {
    if (err) { return cb(err) }
    var tarball = require('./lib/handlers/' + res.type + '/tarball')
    pipe(tarball(res, opts), xtractor, function (err) {
      opts.log.silly('extract', 'extraction finished for', spec)
      cb(err)
    })
  })
}
