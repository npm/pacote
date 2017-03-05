'use strict'

const BB = require('bluebird')

const finalizeManifest = require('./lib/finalize-manifest')
const optCheck = require('./lib/util/opt-check')
const rps = BB.promisify(require('realize-package-specifier'))

let handlers = {}

module.exports = manifest
function manifest (spec, opts) {
  opts = optCheck(opts)

  return rps(spec).then(res => {
    const fetcher = (
      handlers[res.type] ||
      (
        handlers[res.type] =
        require('./lib/handlers/' + res.type + '/manifest')
      )
    )
    return fetcher(res, opts).then(manifest => {
      return finalizeManifest(manifest, res, opts)
    })
  })
}
