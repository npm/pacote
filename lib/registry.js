const Fetcher = require('./fetcher.js')
const RemoteFetcher = require('./remote.js')
const _tarballFromResolved = Symbol.for('pacote.Fetcher._tarballFromResolved')
const pacoteVersion = require('../package.json').version
const npa = require('npm-package-arg')
const pickManifest = require('npm-pick-manifest')
const ssri = require('ssri')
const Minipass = require('minipass')

// Corgis are cute. 🐕🐶
const corgiDoc = 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*'
const fullDoc = 'application/json'

const fetch = require('npm-registry-fetch')

// TODO: memoize reg requests, so we don't even have to check cache

const _headers = Symbol('_headers')
class RegistryFetcher extends Fetcher {
  constructor (spec, opts) {
    super(spec, opts)
    // handle case when npm-package-arg guesses wrong.
    if (this.spec.type === 'tag' &&
        this.spec.rawSpec === '' &&
        this.tag !== 'latest')
      this.spec = npa(`${this.spec.name}@${this.tag}`)
    this.registry = fetch.pickRegistry(spec, opts)
    this.packumentUrl = this.registry.replace(/\/*$/, '/') +
      this.spec.escapedName

    // XXX pacote <=9 has some logic to ignore opts.resolved if
    // the resolved URL doesn't go to the same registry.
    // Consider reproducing that here, to throw away this.resolved
    // in that case.
  }

  resolve () {
    if (this.resolved)
      return Promise.resolve(this.resolved)

    // fetching the manifest sets resolved and (usually) integrity
    return this.manifest().then(() => {
      if (this.resolved)
        return this.resolved

      throw Object.assign(
        new Error('Invalid package manifest: no `dist.tarball` field'),
        { package: this.spec.toString() }
      )
    })
  }

  [_headers] () {
    return {
      // npm will override UA, but ensure that we always send *something*
      'user-agent': this.opts['user-agent'] ||
        `pacote/${pacoteVersion} node/${process.version}`,
      ...(this.opts.headers || {}),
      'pacote-version': pacoteVersion,
      'pacote-req-type': 'packument',
      'pacote-pkg-id': `registry:${this.spec.name}`,
      accept: this.opts.fullMetadata ? fullDoc : corgiDoc,
    }
  }

  packument () {
    // npm-registry-fetch the packument
    // set the appropriate header for corgis if fullMetadata isn't set
    // return the res.json() promise
    return fetch(this.packumentUrl, {
      ...this.opts,
      headers: this[_headers](),
      spec: this.spec,
      // never check integrity for packuments themselves
      integrity: null,
    }).then(res => res.json().then(packument => {
      packument._cached = res.headers.has('x-local-cache')
      packument._contentLength = +res.headers.get('content-length')
      return packument
    })).catch(er => {
      if (er.code === 'E404' && !this.fullMetadata) {
        // possible that corgis are not supported by this registry
        this.fullMetadata = true
        return this.packument()
      }
      throw er
    })
  }

  manifest () {
    return this.packument()
      .then(packument => pickManifest(packument, this.spec.fetchSpec, {
        ...this.opts,
        defaultTag: this.tag,
        enjoyBy: this.enjoyBy,
      }) /* XXX add ETARGET and E403 revalidation of cached packuments here */)
      .then(mani => {
        // add _resolved and _integrity from dist object
        const { dist } = mani
        if (dist) {
          this.resolved = mani._resolved = dist.tarball
          if (dist.integrity)
            this.integrity = ssri.parse(dist.integrity)
          else if (dist.shasum)
            this.integrity = ssri.fromHex(dist.shasum, 'sha1', this.opts)
          if (this.integrity)
            mani._integrity = String(this.integrity)
        }
        return mani
      })
  }

  [_tarballFromResolved] () {
    // we use a RemoteFetcher to get the actual tarball stream
    const stream = new Minipass()
    new RemoteFetcher(this.resolved, {
      ...this.opts,
      integrity: this.integrity,
      resolved: this.resolved,
      pkgid: `registry:${this.spec.name}@${this.resolved}`,
    })[_tarballFromResolved]().pipe(stream)
    return stream
  }

  get types () {
    return [
      'tag',
      'version',
      'range',
    ]
  }
}
module.exports = RegistryFetcher
