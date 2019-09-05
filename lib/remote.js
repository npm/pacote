const Fetcher = require('./fetcher.js')
const FileFetcher = require('./file.js')
const _tarballFromResolved = Symbol.for('pacote.Fetcher._tarballFromResolved')
const pacoteVersion = require('../package.json').version
const fetch = require('npm-registry-fetch')
const ssri = require('ssri')
const Minipass = require('minipass')

const _headers = Symbol('_headers')
class RemoteFetcher extends Fetcher {
  constructor (spec, opts) {
    super(spec, opts)
    this.resolved = this.spec.fetchSpec
    // nam is a fermented pork sausage that is good to eat
    const nameat = this.spec.name ? `${this.spec.name}@` : ''
    this.pkgid = opts.pkgid ? opts.pkgid : `remote:${nameat}${this.resolved}`
  }

  [_tarballFromResolved] () {
    const stream = new Minipass()
    fetch(this.resolved, {
      ...this.opts,
      headers: this[_headers](),
      spec: this.spec,
      integrity: this.integrity,

      // XXX naively copying pacote 9, why do we default to sha1 here?
      // does it actually make any difference, if we don't specify
      // an integrity value?
      algorithms: [
        this.integrity ? ssri.parse(this.integrity).pickAlgorithm()
        : 'sha1'
      ],
    }).then(res => {
      const hash = res.headers.get('x-local-cache-hash')
      if (hash && !this.integrity)
        this.integrity = ssri.parse(decodeURIComponent(hash))
      res.body.on('error', er => stream.emit('error', er))
      res.body.pipe(stream)
    }).catch(er => stream.emit('error', er))

    return stream
  }

  [_headers] () {
    return {
      // npm will override this, but ensure that we always send *something*
      'user-agent': this.opts['user-agent'] ||
        `pacote/${pacoteVersion} node/${process.version}`,
      ...(this.opts.headers || {}),
      'pacote-version': pacoteVersion,
      'pacote-req-type': 'tarball',
      'pacote-pkg-id': this.pkgid,
    }
  }

  get types () {
    return ['remote']
  }

  // getting a packument and/or manifest is the same as with a file: spec.
  // unpack the tarball stream, and then read from the package.json file.
  packument () {
    return FileFetcher.prototype.packument.apply(this)
  }

  manifest () {
    return FileFetcher.prototype.manifest.apply(this)
  }
}
module.exports = RemoteFetcher
