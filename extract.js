'use strict'

const BB = require('bluebird')

const cache = require('./lib/cache')
const extractStream = require('./lib/extract-stream')
const pipe = BB.promisify(require('mississippi').pipe)
const optCheck = require('./lib/util/opt-check')
const rps = BB.promisify(require('realize-package-specifier'))

module.exports = extract
function extract (spec, dest, opts) {
  opts = optCheck(opts)
  if (opts.digest) {
    opts.log.silly('extract', 'trying ', spec, ' digest:', opts.digest)
    return extractByDigest(
      dest, opts
    ).catch(err => {
      if (err && err.code === 'ENOENT') {
        opts.log.silly('extract', 'digest for', spec, 'not present. Using manifest.')
        return extractByManifest(spec, dest, opts)
      } else {
        throw err
      }
    })
  } else {
    opts.log.silly('extract', 'no digest provided for ', spec, '- extracting by manifest')
    return extractByManifest(spec, dest, opts)
  }
}

function extractByDigest (dest, opts) {
  const xtractor = extractStream(dest, opts)
  const cached = cache.get.stream.byDigest(opts.cache, opts.digest, opts)
  return pipe(cached, xtractor)
}

function extractByManifest (spec, dest, opts) {
  const res = typeof spec === 'string'
  ? rps(spec, opts.where)
  : BB.resolve(spec)
  const xtractor = extractStream(dest, opts)
  return res.then(res => {
    const tarball = require('./lib/handlers/' + res.type + '/tarball')
    return pipe(tarball(res, opts), xtractor)
  })
}
