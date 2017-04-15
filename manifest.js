'use strict'

const finalizeManifest = require('./lib/finalize-manifest')
const optCheck = require('./lib/util/opt-check')
const pinflight = require('promise-inflight')
const npa = require('npm-package-arg')

let handlers = {}

module.exports = manifest
function manifest (spec, opts) {
  opts = optCheck(opts)
  spec = typeof spec === 'string' ? npa(spec, opts.where) : spec

  const label = [
    spec.name,
    spec.saveSpec || spec.fetchSpec,
    spec.type,
    opts.cache,
    opts.registry,
    opts.scope
  ].join(':')
  return pinflight(label, () => {
    const startTime = Date.now()
    const fetcher = (
      handlers[spec.type] ||
      (
        handlers[spec.type] =
        require('./lib/handlers/' + spec.type + '/manifest')
      )
    )
    return fetcher(spec, opts).then(manifest => {
      return finalizeManifest(manifest, spec, opts)
    }).then(manifest => {
      // Metadata about the way this manifest was requested
      if (opts.annotate) {
        manifest._requested = spec
        manifest._spec = spec.raw
        manifest._where = opts.where
      }

      const elapsedTime = Date.now() - startTime
      opts.log.verbose('pacote', `${spec.type} manifest for ${spec.name}@${spec.saveSpec || spec.fetchSpec} fetched in ${elapsedTime}ms`)
      return manifest
    })
  })
}
