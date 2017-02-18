'use strict'

var cache = require('./lib/cache')
var finished = require('mississippi').finished
var optCheck = require('./lib/util/opt-check')
var rps = require('realize-package-specifier')

module.exports = prefetch
function prefetch (spec, opts, cb) {
  if (!cb) {
    cb = opts
    opts = null
  }
  opts = optCheck(opts)
  if (!opts.cache) {
    opts.log.info('prefetch', 'skipping prefetch: no cache provided')
    setImmediate(function () { cb() })
  }
  if (opts.digest) {
    opts.log.silly('prefetch', 'checking if ', spec, ' digest is already cached')
    cache.get.hasContent(opts.cache, opts.digest, function (err, exists) {
      if (err) { return cb(err) }
      if (exists) {
        opts.log.silly('prefetch', 'content already exists for', spec)
        return cb(null)
      } else {
        return prefetchByManifest(spec, opts, cb)
      }
    })
  } else {
    opts.log.silly('prefetch', 'no digest provided for ', spec, '- fetching by manifest')
    prefetchByManifest(spec, opts, cb)
  }
}

function prefetchByManifest (spec, opts, cb) {
  rps(spec, function (err, res) {
    if (err) { return cb(err) }
    var stream = require('./lib/handlers/' + res.type + '/tarball')(res, opts)
    finished(stream, function (err) {
      opts.log.silly('prefetch', 'prefetch finished for', spec)
      cb(err)
    })
    stream.on('data', function () {})
  })
}
