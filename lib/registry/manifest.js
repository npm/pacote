'use strict'

const BB = require('bluebird')

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

  return fetchPackument(uri, registry, opts).then(packument => {
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
        opts.preferOnline = true
        return manifest(spec, opts)
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

function fetchPackument (uri, registry, opts) {
  const startTime = Date.now()
  const auth = opts.auth && opts.auth[registryKey(registry)]
  const memo = opts.memoize && opts.memoize.get // `memoize` is a Map-like
  return memo && memo.has(uri) ? BB.resolve(memo.get(uri)).then(p => {
    opts.log.http('registry:manifest', `MEMOIZED ${uri}`)
    return p
  }) : fetch(uri, {
    agent: opts.agent,
    cache: opts.offline
    ? 'only-if-cached'
    : opts.preferOffline
    ? 'force-cache'
    : opts.preferOnline
    ? 'no-cache'
    : 'default',
    cacheManager: opts.cache,
    headers: {
      // Corgis are cute. 🐕🐶
      accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
      authorization: (auth && auth.token && `Bearer ${auth.token}`) || '',
      'user-agent': opts.userAgent,
      'pacote-req-type': 'packument',
      'pacote-pkg-id': `registry:${manifest.name}`
    },
    proxy: opts.proxy,
    retry: opts.retry,
    timeout: opts.timeout
  }).then(res => res.json().then(packument => {
    if (res.headers.get('npm-notice')) {
      opts.log.warn('notice', res.headers.get('npm-notice'))
    }
    const elapsedTime = Date.now() - startTime
    const attempt = res.headers.get('x-fetch-attempts')
    const attemptStr = attempt && attempt > 1 ? ` attempt #${attempt}` : ''
    const cacheStr = res.headers.get('x-local-cache') ? ' (from cache)' : ''
    opts.log.http(
      'registry:manifest',
      `GET ${res.status} ${uri} ${elapsedTime}ms${attemptStr}${cacheStr}`
    )
    if (res.status >= 400) {
      const err = new Error(`Failed with ${res.status} while fetching ${uri}. ${JSON.stringify(packument)}`)
      err.code = `E${res.status}`
      err.response = res
      throw err
    }
    opts.log.silly('pacote', res.headers.raw())
    packument._cached = !!res.headers.get('x-local-cache')
    packument._contentLength = +res.headers.get('content-length')
    memo && memo.set(uri, packument)
    return packument
  }))
}
