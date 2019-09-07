// This is the base class that the other fetcher types in lib
// all descend from.
// It handles the unpacking and retry logic that is shared among
// all of the other Fetcher types.

const npa = require('npm-package-arg')
const ssri = require('ssri')
const { promisify } = require('util')
const { basename, dirname } = require('path')
const rimraf = promisify(require('rimraf'))
const tar = require('tar')
const procLog = require('./util/proc-log.js')
const retry = require('promise-retry')
const fsm = require('fs-minipass')
const cacache = require('cacache')
const osenv = require('osenv')

// we only change ownership on unix platforms, and only if uid is 0
const selfOwner = process.getuid && process.getuid() === 0 ? {
  uid: 0,
  gid: process.getgid(),
} : null
const chownr = selfOwner ? promisify(require('chownr')) : null
const inferOwner = selfOwner ? require('infer-owner') : null
const mkdirp = promisify(require('mkdirp'))
const cacheDir = require('./util/cache-dir.js')

// Private methods.
// Child classes should not have to override these.
// Users should never call them.
const _chown = Symbol('_chown')
const _extract = Symbol('_extract')
const _mkdir = Symbol('_mkdir')
const _toFile = Symbol('_toFile')
const _tarxOptions = Symbol('_tarxOptions')
const _entryMode = Symbol('_entryMode')
const _istream = Symbol('_istream')
const _assertType = Symbol('_assertType')
const _tarballFromCache = Symbol.for('pacote.Fetcher._tarballFromCache')
const _tarballFromResolved = Symbol.for('pacote.Fetcher._tarballFromResolved')

class FetcherBase {
  constructor (spec, opts) {
    if (!opts || typeof opts !== 'object')
      throw new TypeError('options object is required')
    this.spec = npa(spec, opts.where)
    this[_assertType]()
    this.opts = opts
    this.cache = opts.cache || cacheDir()
    this.resolved = opts.resolved || null
    this.integrity = opts.integrity || null
    this.type = this.constructor.name
    this.fmode = opts.fmode || 0o666
    this.dmode = opts.dmode || 0o777
    this.umask = opts.umask || 0o022
    this.log = opts.log || procLog

    this.preferOnline = !!opts.preferOnline || !!opts['prefer-online']
    this.preferOffline = !!opts.preferOffline || !!opts['prefer-offline']
    this.offline = !!opts.offline

    this.enjoyBy = opts.enjoyBy || opts['enjoy-by'] || opts.before
    this.fullMetadata = this.enjoyBy ? true
      : (opts.fullMetadata || opts['full-metadata'])
    this.tag = opts.tag || 'latest'
    this.registry = opts.registry || 'https://registry.npmjs.org'

    // command to run 'prepare' scripts on directories and git dirs
    // To use pacote with yarn, for example, set npmBin to 'yarn'
    // and npmRunCmd to [], and npmCliConfig with yarn's equivalents.
    this.npmBin = opts.npmBin || 'npm'
    this.npmRunCmd = opts.npmRunCmd || 'run'

    // command to install deps for preparing
    this.npmInstallCmd = opts.npmInstallCmd || [
      'install',
      '--dev',
      '--prod',
      '--ignore-prepublish',
      '--no-progress',
      '--no-save',
    ]

    // XXX fill more of this in based on what we know from this.opts
    // we explicitly DO NOT fill in --tag, though, since we are often
    // going to be packing in the context of a publish, which may set
    // a dist-tag, but certainly wants to keep defaulting to latest.
    this.npmCliConfig = opts.npmCliConfig || [
      `--cache=${this.cache}`,
      `--prefer-offline=${!!this.preferOffline}`,
      `--prefer-online=${!!this.preferOnline}`,
      `--offline=${!!this.offline}`,
      `--enjoy-by=${this.enjoyBy ? this.enjoyBy.toISOString() : ''}`,
    ]
  }

  get notImplementedError () {
    return new Error('not implemented in this fetcher type: ' + this.type)
  }

  // override in child classes
  // Returns a Promise that resolves to this.resolved string value
  resolve () {
    return this.resolved ? Promise.resolve(this.resolved)
      : Promise.reject(this.notImplementedError)
  }

  packument () {
    return Promise.reject(this.notImplementedError)
  }

  // override in child class
  // returns a manifest containing:
  // - name
  // - version
  // - _resolved
  // - _integrity
  // - plus whatever else was in there (corgi, full metadata, or pj file)
  manifest () {
    return Promise.reject(this.notImplementedError)
  }

  // private, should be overridden.
  // Note that they should *not* calculate or check integrity, but *just*
  // return the raw tarball data stream.
  [_tarballFromResolved] () {
    throw this.notImplementedError
  }

  // public, should not be overridden
  tarball () {
    return this.tarballStream(stream => new Promise((res, rej) => {
      const buf = []
      stream.on('error', er => rej(er))
      stream.on('end', () => {
        const data = Buffer.concat(buf)
        data.integrity = String(this.integrity)
        data.resolved = this.resolved
        return res(data)
      })
      stream.on('data', d => buf.push(d))
    }))
  }

  // private, only overridden by GitFetcher
  // Note: cacache will raise a EINTEGRITY error if the integrity doesn't match
  [_tarballFromCache] () {
    if (!this.integrity)
      throw new TypeError('cannot read from cache without integrity')
    return cacache.get.stream.byDigest(this.cache, this.integrity, this.opts)
  }

  [_istream] (stream) {
    // everyone will need one of these, either for verifying or calculating
    const istream = ssri.integrityStream(this.opts)
    if (!this.integrity)
      istream.on('integrity', i => this.integrity = i)
    return stream.pipe(istream)
  }

  isDataCorruptionError (er) {
    return er.code === 'EINTEGRITY' || er.code === 'Z_DATA_ERROR'
  }

  // override the types getter
  get types () {}
  [_assertType] () {
    if (this.types && !this.types.includes(this.spec.type)) {
      throw new TypeError(`Wrong spec type (${
        this.spec.type
      }) for ${
        this.constructor.name
      }. Supported types: ${this.types.join(', ')}`)
    }
  }

  // We allow ENOENTs from cacache, but not anywhere else.
  // An ENOENT trying to read a tgz file, for example, is Right Out.
  isRetriableError (er) {
    return this.isDataCorruptionError(er) || (
      er.code === 'ENOENT' && er.isOperational
    )
  }

  // Mostly internal, but has some uses
  // Pass in a function which returns a promise
  // Function will be called 1 or more times with streams that may fail.
  // Retries:
  // Function MUST handle errors on the stream by rejecting the promise,
  // so that retry logic can pick it up and either retry or fail whatever
  // promise it was making (ie, failing extraction, etc.)
  //
  // The return value of this method is a Promise that resolves the same
  // as whatever the streamHandler resolves to.
  //
  // This should never be overridden by child classes, but it is public.
  tarballStream (streamHandler) {
    // Only short-circuit via cache if we have everything else we'll need,
    // and the user has not expressed a preference for checking online.

    const fromCache = (
      !this.preferOnline &&
      this.integrity &&
      this.resolved
    ) ? streamHandler(this[_tarballFromCache]()).catch(er => {
      if (this.isDataCorruptionError(er)) {
        this.log.warn('tarball', `cached data for ${
          this.spec
        } (${this.integrity}) seems to be corrupted. Refreshing cache.`)
        return this.cleanupCached().then(() => { throw er })
      } else {
        throw er
      }
    }) : null

    const fromResolved = er => {
      if (er) {
        if (!this.isRetriableError(er))
          throw er
        this.log.silly('tarball', `no local data for ${
          this.spec
        }. Extracting by manifest.`)
      }
      return this.resolve().then(() => retry(tryAgain =>
        streamHandler(this[_istream](this[_tarballFromResolved]()))
        .catch(er => {
          // Retry once if we have a cache, to clear up any weird conditions.
          // Don't retry network errors, though -- make-fetch-happen has
          // already taken care of making sure we're all set on that front.
          if (er.code && !/^E[0-9]{3}$/.test(er.code + '')) {
            if (this.isDataCorruptionError(er)) {
              this.log.warn('tarball', `tarball data for ${
                this.spec
              } (${this.integrity}) seems to be corrupted. Trying again.`)
            }
            return this.cleanupCached().then(() => tryAgain(er))
          }
          throw er
        }), { retries: 1, minTimeout: 0, maxTimeout: 0 }))
    }

    return fromCache ? fromCache.catch(fromResolved) : fromResolved()
  }

  cleanupCached () {
    return cacache.rm.content(this.cache, this.integrity, this.opts)
  }

  [_chown] (path, uid, gid) {
    return selfOwner && (selfOwner.gid !== gid || selfOwner.uid !== uid)
      ? chownr(path, uid, gid)
      : /* istanbul ignore next - we don't test in root-owned folders */ null
  }

  [_mkdir] (dest) {
    // if we're bothering to do owner inference, then do it.
    // otherwise just make the dir, and return an empty object.
    // always rimraf to ensure an empty dir to start with, but do so
    // _after_ inferring the owner, in case there's an existing folder
    // there that we would want to preserve which differs from the
    // parent folder (rare, but probably happens sometimes).
    return !inferOwner
      ? rimraf(dest).then(() => mkdirp(dest)).then(() => ({}))
      : inferOwner(dest).then(({uid, gid}) =>
        rimraf(dest)
          .then(() => mkdirp(dest))
          .then(made => {
            // ignore the || dest part in coverage.  It's there to handle
            // race conditions where the dir may be made by someone else
            // after being removed by us.
            const dir = made || /* istanbul ignore next */ dest
            return this[_chown](dir, uid, gid)
          })
          .then(() => ({uid, gid})))
  }

  // extraction is always the same.  the only difference is where
  // the tarball comes from.
  extract (dest) {
    return this[_mkdir](dest).then(({uid, gid}) =>
      this.tarballStream(tarball => this[_extract](dest, tarball, uid, gid)))
  }

  [_toFile] (dest) {
    return this.tarballStream(str => new Promise((res, rej) => {
      const writer = new fsm.WriteStream(dest)
      str.on('error', er => rej(er))
      writer.on('error', er => rej(er))
      writer.on('finish', () => res({
        integrity: this.integrity && String(this.integrity),
        resolved: this.resolved,
      }))
      str.pipe(writer)
    }))
  }

  // don't use this[_mkdir] because we don't want to rimraf anything
  tarballFile (dest) {
    const dir = dirname(dest)
    return !inferOwner
      ? mkdirp(dir).then(() => this[_toFile](dest))
      : inferOwner(dest).then(({uid, gid}) =>
        mkdirp(dir).then(made =>
          this[_toFile](dest)
          .then(res => this[_chown](made || dir, uid, gid))
          .then(() => res)))
  }

  [_extract] (dest, tarball, uid, gid) {
    const extractor = tar.x(this[_tarxOptions]({ cwd: dest, uid, gid }))
    return new Promise((resolve, reject) => {
      extractor.on('close', () => resolve({
        resolved: this.resolved,
        integrity: this.integrity && String(this.integrity),
      }))
      extractor.on('error', reject)
      tarball.on('error', reject)
      tarball.pipe(extractor)
    })
  }

  // always ensure that entries are at least as permissive as our configured
  // dmode/fmode, but never more permissive than the umask allows.
  [_entryMode] (mode, type) {
    const m = type === 'Directory' ? this.dmode
      : type === 'File' ? this.fmode
      : /* istanbul ignore next - should never happen in a pkg */ 0
    return (mode | m) & ~this.umask
  }

  [_tarxOptions] ({ cwd, uid, gid }) {
    const sawIgnores = new Set()
    return {
      cwd,
      filter: (name, entry) => {
        if (/^.*link$/i.test(entry.type))
          return false
        entry.mode = this[_entryMode](entry.mode, entry.type)
        // this replicates the npm pack behavior where .gitignore files
        // are treated like .npmignore files, but only if a .npmignore
        // file is not present.
        if (entry.type === 'File') {
          const base = basename(entry.path)
          if (base === '.npmignore')
            sawIgnores.add(entry.path)
          else if (base === '.gitignore') {
            // rename, but only if there's not already a .npmignore
            const ni = entry.path.replace(/\.gitignore$/, '.npmignore')
            if (sawIgnores.has(ni))
              return false
            entry.path = ni
          }
          return true
        }
      },
      strip: 1,
      onwarn: /* istanbul ignore next - we can trust that tap logs */
        msg => this.log.warn('tar', msg),
      uid,
      gid,
      umask: this.umask,
    }
  }
}

module.exports = FetcherBase

// Child classes
const GitFetcher = require('./git.js')
const RegistryFetcher = require('./registry.js')
const FileFetcher = require('./file.js')
const DirFetcher = require('./dir.js')
const RemoteFetcher = require('./remote.js')

// Get an appropriate fetcher object from a spec and options
FetcherBase.get = (rawSpec, opts = {}) => {
  const spec = npa(rawSpec, opts.where)
  switch (spec.type) {
    case 'git':
      return new GitFetcher(spec, opts)

    case 'remote':
      return new RemoteFetcher(spec, opts)

    case 'version':
    case 'range':
    case 'tag':
      return new RegistryFetcher(spec, opts)

    case 'file':
      return new FileFetcher(spec, opts)

    case 'directory':
      return new DirFetcher(spec, opts)

    default:
      throw new TypeError('Unknown spec type: ' + spec.type)
  }
}
