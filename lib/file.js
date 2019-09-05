const Fetcher = require('./fetcher.js')
const fsm = require('fs-minipass')
const cacache = require('cacache')
const { promisify } = require('util')
const readPackageJson = promisify(require('read-package-json'))
const _tarballFromResolved = Symbol.for('pacote.Fetcher._tarballFromResolved')

class FileFetcher extends Fetcher {
  constructor (spec, opts) {
    super(spec, opts)
    // just the fully resolved filename
    this.resolved = this.spec.fetchSpec
  }

  get types () {
    return ['file']
  }

  manifest () {
    // have to unpack the tarball for this.
    return cacache.tmp.withTmp(this.cache, this.opts, dir =>
      this.extract(dir)
      .then(() => readPackageJson(dir + '/package.json'))
      .then(mani => ({
        ...mani,
        _integrity: String(this.integrity),
        _resolved: this.resolved,
      })))
  }

  [_tarballFromResolved] () {
    // create a read stream and return it
    return new fsm.ReadStream(this.resolved)
  }

  packument () {
    // simulate based on manifest
    return this.manifest().then(mani => ({
      name: mani.name,
      'dist-tags': {
        [this.tag]: mani.version
      },
      versions: {
        [mani.version]: {
          ...mani,
          dist: {
            tarball: `file:${this.resolved}`,
            integrity: String(this.integrity),
          }
        }
      }
    }))
  }
}

module.exports = FileFetcher
