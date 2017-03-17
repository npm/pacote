'use strict'

const BB = require('bluebird')

const cache = require('./lib/cache')
const finished = BB.promisify(require('mississippi').finished)
const optCheck = require('./lib/util/opt-check')
const rps = BB.promisify(require('realize-package-specifier'))

module.exports = prefetch
function prefetch (spec, opts) {
  opts = optCheck(opts)
  if (!opts.cache) {
    opts.log.info('prefetch', 'skipping prefetch: no cache provided')
    return BB.resolve()
  }
  if (opts.digest) {
    opts.log.silly('prefetch', 'checking if ', spec, ' digest is already cached')
    return cache.get.hasContent(opts.cache, opts.digest, opts.hashAlgorithm).then(exists => {
      if (exists) {
        opts.log.silly('prefetch', 'content already exists for', spec)
      } else {
        return prefetchByManifest(spec, opts)
      }
    })
  } else {
    opts.log.silly('prefetch', 'no digest provided for ', spec, '- fetching by manifest')
    return prefetchByManifest(spec, opts)
  }
}

function prefetchByManifest (spec, opts) {
  const res = typeof spec === 'string'
  ? rps(spec, opts.where)
  : BB.resolve(spec)
  return res.then(res => {
    const stream = require('./lib/handlers/' + res.type + '/tarball')(res, opts)
    setImmediate(() => stream.on('data', function () {}))
    return finished(stream)
  })
}
