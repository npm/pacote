'use strict'

const BB = require('bluebird')

const checkWarnings = require('./check-warning-header')
const fetch = require('make-fetch-happen')
const optCheck = require('../util/opt-check')
const pickManifest = require('./pick-manifest')
const pickRegistry = require('./pick-registry')
const registryKey = require('./registry-key')
const ssri = require('ssri')
const url = require('url')

module.exports = manifest
function manifest (spec, opts) {
  opts = optCheck(opts)

  const registry = pickRegistry(spec, opts)
  const uri = metadataUrl(registry, spec.escapedName)

  return fetchPackument(uri, spec, registry, opts).then(packument => {
    return pickManifest(packument, spec, {
      engineFilter: opts.engineFilter,
      defaultTag: opts.defaultTag
    }).catch(err => {
      if (
        err.code === 'ETARGET' &&
        packument._cached &&
        !opts.offline
      ) {
        opts.log.silly(
          'registry:manifest',
          `no matching version for ${spec.name}@${spec.fetchSpec} in the cache. Forcing revalidation`
        )
        opts.preferOffline = false
        opts.preferOnline = true
        return fetchPackument(uri, spec, registry, opts).then(packument => {
          return pickManifest(packument, spec, {
            engineFilter: opts.engineFilter,
            defaultTag: opts.defaultTag
          })
        })
      }
      throw err
    })
  }).then(manifest => {
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
  })
}

function metadataUrl (registry, name) {
  const normalized = registry.slice(-1) !== '/'
  ? registry + '/'
  : registry
  return url.resolve(normalized, name)
}

function fetchPackument (uri, spec, registry, opts) {
  const startTime = Date.now()
  const auth = opts.auth && opts.auth[registryKey(registry)]
  const memo = opts.memoize && opts.memoize.get // `memoize` is a Map-like
  const cacheMode = opts.offline
  ? 'only-if-cached'
  : opts.preferOffline
  ? 'force-cache'
  : opts.preferOnline
  ? 'no-cache'
  : 'default'
  return memo && memo.has(uri) ? BB.resolve(memo.get(uri)).then(p => {
    opts.log.http('registry:manifest', `MEMOIZED ${uri}`)
    return p
  }) : fetch(uri, {
    agent: opts.agent,
    cache: cacheMode,
    cacheManager: opts.cache,
    headers: {
      accept: opts.fullMetadata
      ? 'application/json'
      // Corgis are cute. 🐕🐶
      : 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
      authorization: (auth && auth.token && `Bearer ${auth.token}`) || '',
      'npm-in-ci': opts.isFromCI,
      'npm-scope': opts.projectScope,
      'user-agent': opts.userAgent,
      'pacote-req-type': 'packument',
      'pacote-pkg-id': `registry:${manifest.name}`,
      'referer': opts.refer
    },
    proxy: opts.proxy,
    retry: opts.retry,
    timeout: opts.timeout
  }).then(res => res.json().then(packument => {
    if (res.headers.has('npm-notice') && !res.headers.has('x-local-cache')) {
      opts.log.warn('notice', res.headers.get('npm-notice'))
    }
    checkWarnings(res, registry, opts)
    const elapsedTime = Date.now() - startTime
    const attempt = res.headers.get('x-fetch-attempts')
    const attemptStr = attempt && attempt > 1 ? ` attempt #${attempt}` : ''
    const cacheStr = res.headers.get('x-local-cache') ? ' (from cache)' : ''
    opts.log.http(
      'registry:manifest',
      `GET ${res.status} ${uri} ${elapsedTime}ms${attemptStr}${cacheStr}`
    )
    if (res.status >= 400) {
      const err = new Error(`${res.statusText}: ${spec} (${uri}). ${JSON.stringify(packument)}`)
      err.code = `E${res.status}`
      err.spec = spec
      err.packument = packument
      err.response = res
      throw err
    }
    packument._cached = res.headers.has('x-local-cache')
    packument._contentLength = +res.headers.get('content-length')
    memo && memo.set(uri, packument)
    return packument
  }))
}
