var cache = require('./lib/cache')
var gunzip = require('./lib/util/gunzip-maybe')
var pipe = require('mississippi').pipe
var pipeline = require('mississippi').pipeline
var optCheck = require('./lib/util/opt-check')
var rps = require('realize-package-specifier')
var tar = require('tar-fs')

module.exports = extract
function extract (spec, dest, opts, cb) {
  if (!cb) {
    cb = opts
    opts = null
  }
  opts = optCheck(opts)
  var xtractor = pipeline(gunzip(), tar.extract(dest, {
    map: function (header) {
      header.name = header.name.replace(/^package\//, '')
      return header
    }
  }))
  var caStream = cache.get.stream.byDigest(opts.cache, opts.digest, opts)
  if (opts.digest) {
    opts.log.silly('extract', 'trying from digest:', opts.digest)
  }
  caStream.on('error', function (err) {
    if (err && err.code !== 'ENOENT') { return cb(err) }
    rps(spec, function (err, res) {
      if (err) { return cb(err) }
      var tarball = require('./lib/handlers/' + res.type + '/tarball')
      pipe(tarball(res, opts), xtractor, function (err) {
        opts.log.silly('extract', 'extraction finished for', spec)
        cb(err)
      })
    })
  }).on('end', function () {
    opts.log.silly('extract', spec, 'extracted by digest')
    cb(null)
  }).pipe(xtractor)
}
