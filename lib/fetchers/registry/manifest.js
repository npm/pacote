'use strict'

const BB = require('bluebird')

const fetch = require('./fetch')
const optCheck = require('../../util/opt-check')
const pickManifest = require('npm-pick-manifest')
const pickRegistry = require('./pick-registry')
const ssri = require('ssri')
const url = require('url')

// Corgis are cute. 🐕🐶
const CORGI_DOC = 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*'
const JSON_DOC = 'application/json'

module.exports = manifest
function manifest (spec, opts) {
  opts = optCheck(opts)

  const registry = pickRegistry(spec, opts)
  const uri = metadataUrl(registry, spec.escapedName)

  return getManifest(uri, registry, spec, opts).then(manifest => {
    return annotateManifest(uri, registry, manifest)
  })
}

function metadataUrl (registry, name) {
  const normalized = registry.slice(-1) !== '/'
  ? registry + '/'
  : registry
  return url.resolve(normalized, name)
}

function getManifest (uri, registry, spec, opts) {
  return fetchPackument(uri, spec, registry, opts).then(packument => {
    try {
      return pickManifest(packument, spec.fetchSpec, {
        defaultTag: opts.defaultTag
      })
    } catch (err) {
      if (err.code === 'ETARGET' && packument._cached && !opts.offline) {
        opts.log.silly(
          'registry:manifest',
          `no matching version for ${spec.name}@${spec.fetchSpec} in the cache. Forcing revalidation`
        )
        opts.preferOffline = false
        opts.preferOnline = true
        return fetchPackument(uri, spec, registry, opts).then(packument => {
          return pickManifest(packument, spec.fetchSpec, {
            defaultTag: opts.defaultTag
          })
        })
      } else {
        throw err
      }
    }
  })
}

function fetchPackument (uri, spec, registry, opts) {
  const memo = opts.memoize && opts.memoize.get // `memoize` is a Map-like
  return memo && memo.has(uri) ? BB.resolve(memo.get(uri)).then(p => {
    opts.log.http('registry:manifest', `MEMOIZED ${uri}`)
    return p
  }) : fetch(uri, registry, Object.assign({
    headers: {
      'pacote-req-type': 'packument',
      'pacote-pkg-id': `registry:${manifest.name}`,
      accept: opts.fullMetadata ? JSON_DOC : CORGI_DOC
    }
  }, opts)).then(res => res.json().then(packument => {
    packument._cached = res.headers.has('x-local-cache')
    packument._contentLength = +res.headers.get('content-length')
    memo && memo.set(uri, packument)
    return packument
  }))
}

function annotateManifest (uri, registry, manifest) {
  const shasum = manifest.dist && manifest.dist.shasum
  manifest._integrity = manifest.dist && manifest.dist.integrity
  if (!manifest._integrity && shasum) {
    // Use legacy dist.shasum field if available.
    manifest._integrity = ssri.fromHex(shasum, 'sha1').toString()
  }
  manifest._resolved = (
    manifest.dist && manifest.dist.tarball
  )
  if (!manifest._resolved) {
    const err = new Error(
      `Manifest for ${manifest.name}@${manifest.version} from ${uri} is missing a tarball url (pkg.dist.tarball). Guessing a default.`
    )
    err.code = 'ENOTARBALL'
    err.manifest = manifest
    if (!manifest._warnings) { manifest._warnings = [] }
    manifest._warnings.push(err.message)
    manifest._resolved =
    `${registry}/${manifest.name}/-/${manifest.name}-${manifest.version}.tgz`
  }
  return manifest
}
