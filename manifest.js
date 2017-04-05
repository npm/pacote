'use strict'

const BB = require('bluebird')

const finalizeManifest = require('./lib/finalize-manifest')
const optCheck = require('./lib/util/opt-check')
const pinflight = require('promise-inflight')
const rps = BB.promisify(require('realize-package-specifier'))

let handlers = {}

module.exports = manifest
function manifest (spec, opts) {
  opts = optCheck(opts)

  const res = typeof spec === 'string'
  ? rps(spec, opts.where)
  : BB.resolve(spec)

  return res.then(res => {
    const label = [
      res.raw,
      res.spec,
      res.type,
      opts.cache,
      opts.registry,
      opts.scope
    ].join(':')
    return pinflight(label, () => {
      const startTime = Date.now()
      const fetcher = (
        handlers[res.type] ||
        (
          handlers[res.type] =
          require('./lib/handlers/' + res.type + '/manifest')
        )
      )
      return fetcher(res, opts).then(manifest => {
        return finalizeManifest(manifest, res, opts)
      }).then(manifest => {
        // Metadata about the way this manifest was requested
        if (opts.annotate) {
          manifest._requested = res
          manifest._spec = spec
          manifest._where = opts.where
        }

        const elapsedTime = Date.now() - startTime
        opts.log.verbose('pacote', `${res.type} manifest for ${res.name}@${res.spec} fetched in ${elapsedTime}ms`)
        return manifest
      })
    })
  })
}
