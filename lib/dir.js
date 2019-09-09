const Fetcher = require('./fetcher.js')
const FileFetcher = require('./file.js')
const cacache = require('cacache')
const Minipass = require('minipass')
const { promisify } = require('util')
const readPackageJson = promisify(require('read-package-json'))
const npm = require('./util/npm.js')
const packlist = require('npm-packlist')
const tar = require('tar')
const _prepareDir = Symbol('_prepareDir')

const _tarballFromResolved = Symbol.for('pacote.Fetcher._tarballFromResolved')
class DirFetcher extends Fetcher {
  constructor (spec, opts) {
    super(spec, opts)
    // just the fully resolved filename
    this.resolved = this.spec.fetchSpec
  }

  get types () {
    return ['directory']
  }

  [_prepareDir] (dir) {
    return readPackageJson(dir + '/package.json')
      .then(mani => {
        if (!mani.scripts || !mani.scripts.prepare)
          return

        // we *only* run prepare.
        // pre/post-pack is run by the npm CLI for publish and pack,
        // but this function is *also* run when installing git deps
        return npm(
          this.npmBin,
          [].concat(this.npmRunCmd).concat('prepare').concat(this.npmCliConfig),
          dir,
          'directory preparation failed'
        )
      })
  }


  [_tarballFromResolved] () {
    const stream = new Minipass()
    stream.resolved = this.resolved
    stream.integrity = this.integrity

    // run the prepare script, get the list of files, and tar it up
    // pipe to the stream, and proxy errors the chain.
    this[_prepareDir](this.resolved)
      .then(() => packlist({ path: this.resolved }))
      .then(files => tar.c({
        cwd: this.resolved,
        prefix: 'package/',
        portable: true,
        gzip: true,

        // Provide a specific date in the 1980s for the benefit of zip,
        // which is confounded by files dated at the Unix epoch 0.
        mtime: new Date('1985-10-26T08:15:00.000Z'),
      }, files).on('error', er => stream.emit('error', er)).pipe(stream))
    return stream
  }

  manifest () {
    readPackageJson(this.resolved + '/package.json')
      .then(mani => ({
        ...mani,
        _integrity: String(this.integrity),
        _resolved: this.resolved,
      }))
  }

  packument () {
    return FileFetcher.prototype.packument.apply(this)
  }
}
module.exports = DirFetcher
