var cacache = require('cacache')
var cachingStream = require('./lib/util/caching-stream')
var dezalgo = require('dezalgo')
var extractStream = require('./lib/util/extract-stream')
var pipe = require('mississippi').pipe
var pipeline = require('mississippi').pipeline
var optCheck = require('./lib/util/opt-check')
var rps = require('realize-package-specifier')

module.exports = extract
function extract (spec, dest, opts, cb) {
  if (!cb) {
    cb = opts
    opts = null
  }
  cb = dezalgo(cb)
  opts = optCheck(opts)

  // The cache is content-addressable, so if we got the right options
  // passed in, we can short-circuit the entire process and stream straight
  // from disk. `spec` is essentially ignored on cache hit.
  tryFromCache(dest, opts, function (err, stream) {
    if (err) { return cb(err) }
    if (stream) {
      pipe(stream, extractStream(dest, opts))
    } else {
      // Cache miss. Resolve the spec, grab the package manifest (with a few
      // bells and whistled added), and grab a stream of package data, from
      // whatever source it happens to come from. This is entirely opaque.
      tryFullFetch(spec, opts, function (err, pkg, stream) {
        if (err) { return cb(err) }
        // Just as an extra check, let's make sure our provided digest matches
        // the one declared by the pkg. Something's fishy if these are both
        // present, and don't match.
        if (opts.digest && pkg._shasum && opts.digest !== pkg._shasum) {
          return cb(new Error('fetcher returned unexpected digest'))
        }
        // Take the package stream and extract it to `dest`. This will take
        // care of any required package extraction filtering, permissions, etc.
        pipeToDest(stream, dest, pkg, opts, cb)
      })
    }
  })
}

function tryFromCache (dest, opts, cb) {
  if (!opts.cache || !opts.digest) {
    // Not enough info to grab things by digest :(
    cb(null, false)
  } else {
    // cacache lets us grab a stream straight-up by digest! yay!
    var stream = cacache.get.stream.byDigest(opts.cache, opts.digest, {
      hashAlgorithm: opts.hashAlgorithm
    }).on('error', onErr).on('readable', function ev () {
      stream.removeListener('error', onErr)
      stream.removeListener('readable', ev)
      cb(null, stream)
    })
  }
  function onErr (err) {
    if (err.code === 'ENOENT') {
      cb(null, false)
    } else {
      cb(err)
    }
  }
}

function tryFullFetch (spec, opts, cb) {
  rps(spec, function (err, res) {
    if (err) { return cb(err) }
    // The registry module takes care of both of these.
    var type = (res.type === 'tag' || res.type === 'version')
    ? 'registry'
    : type
    var fetcher = require('./lib/handlers/' + type + '/fetch-stream')
    fetcher(res, opts, cb)
  })
}

function pipeToDest (stream, dest, pkg, opts, cb) {
  if (opts.cache) {
    stream = pipeline(stream, cachingStream(pkg, opts))
  }
  pipe(
    stream,
    extractStream(dest, opts),
    function (err) {
      if (err) { return cb(err) }
      cb(null, pkg)
    }
  )
}
