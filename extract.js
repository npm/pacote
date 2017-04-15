'use strict'

const BB = require('bluebird')

const cache = require('./lib/cache')
const extractStream = require('./lib/extract-stream')
const npa = require('npm-package-arg')
const pipe = BB.promisify(require('mississippi').pipe)
const optCheck = require('./lib/util/opt-check')
const retry = require('promise-retry')
const rimraf = BB.promisify(require('rimraf'))

module.exports = extract
function extract (spec, dest, opts) {
  opts = optCheck(opts)
  spec = typeof spec === 'string' ? npa(spec, opts.where) : spec
  const startTime = Date.now()
  if (opts.integrity && opts.cache && !opts.preferOnline) {
    opts.log.silly('pacote', 'trying', spec.name, 'by hash:', opts.integrity.toString())
    return extractByDigest(
      startTime, spec, dest, opts
    ).catch(err => {
      if (err.code === 'ENOENT') {
        opts.log.silly('pacote', `data for ${opts.integrity} not present. Using manifest.`)
        return extractByManifest(startTime, spec, dest, opts)
      } else if (err.code === 'EINTEGRITY') {
        opts.log.warn('pacote', `cached data for ${opts.integrity} failed integrity check. Refreshing cache.`)
        return cleanUpCached(
          dest, opts.cache, opts.integrity, opts
        ).then(() => {
          return extractByManifest(startTime, spec, dest, opts)
        })
      } else {
        throw err
      }
    })
  } else {
    opts.log.silly('pacote', 'no tarball hash provided for', spec.name, '- extracting by manifest')
    return retry((tryAgain, attemptNum) => {
      return extractByManifest(
        startTime, spec, dest, opts
      ).catch(err => {
        // We're only going to retry at this level if the local cache might
        // have gotten corrupted.
        if (err.code === 'EINTEGRITY' && opts.cache) {
          opts.log.warn('pacote', `tarball integrity check for ${spec.name}@${spec.saveSpec || spec.fetchSpec} failed. Clearing cache entry. ${err.message}`)
          return cleanUpCached(
            dest, opts.cache, err.sri, opts
          ).then(() => tryAgain(err))
        } else {
          throw err
        }
      })
    }, {retries: 1})
  }
}

function extractByDigest (start, spec, dest, opts) {
  const xtractor = extractStream(dest, opts)
  const cached = cache.get.stream.byDigest(opts.cache, opts.integrity, opts)
  return pipe(cached, xtractor).then(() => {
    opts.log.verbose('pacote', `${spec.name}@${spec.saveSpec || spec.fetchSpec} extracted to ${dest} by content address ${Date.now() - start}ms`)
  })
}

function extractByManifest (start, spec, dest, opts) {
  const xtractor = extractStream(dest, opts)
  return BB.resolve(() => {
    const tarball = require('./lib/handlers/' + spec.type + '/tarball')
    return pipe(tarball(spec, opts), xtractor)
  }).then(() => {
    opts.log.verbose('pacote', `${spec.name}@${spec.saveSpec || spec.fetchSpec} extracted in ${Date.now() - start}ms`)
  })
}

function cleanUpCached (dest, cachePath, integrity, opts) {
  return BB.join(
    rimraf(dest),
    cache.rm.content(cachePath, integrity, opts)
  )
}
