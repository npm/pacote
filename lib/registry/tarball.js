'use strict'

const BB = require('bluebird')

const fetch = require('make-fetch-happen')
const manifest = require('./manifest')
const optCheck = require('../util/opt-check')
const PassThrough = require('stream').PassThrough
const pickRegistry = require('./pick-registry')
const pipe = BB.promisify(require('mississippi').pipe)
const registryKey = require('./registry-key')
const ssri = require('ssri')

module.exports = tarball
function tarball (spec, opts) {
  opts = optCheck(opts)
  const stream = new PassThrough()
  manifest(spec, opts).then(manifest => {
    return pipe(
      fromManifest(manifest, spec, opts),
      stream
    )
  }).catch(err => stream.emit('error', err))
  return stream
}

module.exports.fromManifest = fromManifest
function fromManifest (manifest, spec, opts) {
  opts = optCheck(opts)
  const stream = new PassThrough()
  const uri = manifest._resolved
  const registry = pickRegistry(spec, opts)
  const auth = opts.auth && opts.auth[registryKey(registry)]
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
      authorization: auth && auth.token && `Bearer ${auth.token}`,
      'user-agent': opts.userAgent
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
    res.body.on('error', err => stream.emit('error', err))
    if (res.headers.get('npm-notice')) {
      opts.log.warn('notice', res.headers.get('npm-notice'))
    }
    if (res.status >= 400) {
      const err = new Error(`Failed with ${res.status} while fetching ${uri}.`)
      err.code = `E${res.status}`
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
