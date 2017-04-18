'use strict'

const BB = require('bluebird')

const checkWarnings = require('./check-warning-header')
const fetch = require('make-fetch-happen')
const manifest = require('./manifest')
const optCheck = require('../util/opt-check')
const PassThrough = require('stream').PassThrough
const pickRegistry = require('./pick-registry')
const pipe = BB.promisify(require('mississippi').pipe)
const registryKey = require('./registry-key')
const ssri = require('ssri')
const url = require('url')

module.exports = tarball
function tarball (spec, opts) {
  opts = optCheck(opts)
  const stream = new PassThrough()
  manifest(spec, opts).then(manifest => {
    stream.emit('manifest', manifest)
    return pipe(
      fromManifest(manifest, spec, opts).on(
        'integrity', i => stream.emit('integrity', i)
      ),
      stream
    )
  }).catch(err => stream.emit('error', err))
  return stream
}

module.exports.fromManifest = fromManifest
function fromManifest (manifest, spec, opts) {
  opts = optCheck(opts)
  opts.scope = spec.scope || opts.scope
  const stream = new PassThrough()
  const registry = pickRegistry(spec, opts)
  const uri = getTarballUrl(registry, manifest)
  const auth = (
    opts.auth &&
    // If a tarball is on a different registry, don't leak creds
    url.parse(uri).host === url.parse(registry).host &&
    opts.auth[registryKey(registry)]
  )
  const startTime = Date.now()
  fetch(uri, {
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
      authorization: (auth && auth.token && `Bearer ${auth.token}`) || '',
      'npm-in-ci': opts.isFromCI,
      'npm-scope': opts.projectScope,
      'user-agent': opts.userAgent,
      'pacote-req-type': 'tarball',
      'pacote-pkg-id': `registry:${manifest.name}@${manifest.version}`,
      'pacote-pkg-manifest': JSON.stringify(manifest),
      'referer': opts.refer
    },
    integrity: manifest._integrity,
    algorithms: [
      manifest._integrity
      ? ssri.parse(manifest._integrity).pickAlgorithm()
      : 'sha1'
    ],
    proxy: opts.proxy,
    retry: opts.retry,
    timeout: opts.timeout
  }).then(res => {
    stream.emit('integrity', res.headers.get('x-local-cache-hash'))
    res.body.on('error', err => stream.emit('error', err))
    if (res.headers.has('npm-notice') && !res.headers.has('x-local-cache')) {
      opts.log.warn('notice', res.headers.get('npm-notice'))
    }
    checkWarnings(res, registry, opts)
    if (res.status >= 400) {
      const err = new Error(`${res.statusText}: tarball for ${spec} (${uri}).`)
      err.code = `E${res.status}`
      err.spec = spec
      err.response = res
      throw err
    } else {
      res.body.pipe(stream)
      stream.on('end', () => {
        const elapsedTime = Date.now() - startTime
        const attempt = res.headers.get('x-fetch-attempts')
        const attemptStr = attempt && attempt > 1 ? ` attempt #${attempt}` : ''
        const cacheStr = res.headers.get('x-local-cache') ? ' (from cache)' : ''
        opts.log.http(
          'registry:tarball',
          `GET ${res.status} ${uri} ${elapsedTime}ms${attemptStr}${cacheStr}`
        )
      })
    }
  }).catch(err => stream.emit('error', err))
  return stream
}

function getTarballUrl (registry, manifest) {
  // https://github.com/npm/npm/pull/9471
  //
  // TL;DR: Some alternative registries host tarballs on http and packuments on
  // https, and vice-versa. There's also a case where people who can't use SSL
  // to access the npm registry, for example, might use
  // `--registry=http://registry.npmjs.org/`. In this case, we need to rewrite
  // `tarball` to match the protocol.
  //
  const reg = url.parse(registry)
  const tarball = url.parse(manifest._resolved)
  if (reg.hostname === tarball.hostname && reg.protocol !== tarball.protocol) {
    tarball.protocol = reg.protocol
    // Ports might be same host different protocol!
    if (reg.port !== tarball.port) {
      delete tarball.host
      tarball.port = reg.port
    }
    delete tarball.href
  }
  return url.format(tarball)
}
