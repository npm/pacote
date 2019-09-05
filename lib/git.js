const Fetcher = require('./fetcher.js')
const FileFetcher = require('./file.js')
const RemoteFetcher = require('./remote.js')
const DirFetcher = require('./remote.js')
const hashre = /^[a-f0-9]{40}$/
const git = require('./util/git.js')
const pickManifest = require('npm-pick-manifest')
const npa = require('npm-package-arg')
const url = require('url')
const Minipass = require('minipass')
const cacache = require('cacache')
const { promisify } = require('util')
const readPackageJson = promisify(require('read-package-json'))

// hosts that support shallow cloning
const SHALLOW_HOSTS = new Set(['github', 'gist', 'gitlab', 'bitbucket'])

const _resolvedFromRepo = Symbol('_resolvedFromRepo')
const _resolvedFromClone = Symbol('_resolvedFromClone')
const _tarballFromResolved = Symbol.for('pacote.Fetcher._tarballFromResolved')
const _addGitSha = Symbol('_addGitSha')
const _clone = Symbol('_clone')
const _setResolvedWithSha = Symbol('_setResolvedWithSha')

class GitFetcher extends Fetcher {
  constructor (spec, opts) {
    super(spec, opts)
    this.resolvedRef = null
    if (this.spec.gitCommittish && hashre.test(this.spec.gitCommittish)) {
      this.resolvedSha = this.spec.gitCommittish
      // use hosted.tarball() and then later shell to RemoteFetcher
      this.resolved = this.spec.hosted
        ? this.spec.hosted.tarball()
        : this.spec.fetchSpec + '#' + this.spec.gitCommittish
    } else
      this.resolvedSha = ''
  }

  get types () {
    return ['git']
  }

  resolve () {
    // likely a hosted git repo with a sha, so get the tarball url
    // but in general, no reason to resolve() more than necessary!
    if (this.resolved)
      return super.resolve()

    // fetch the git repo and then look at the current hash
    // XXX copied from Pacote 9, do we really need to do this much
    // falling back?  every hosted-git-info host provides all three.
    const h = this.spec.hosted
    return h ? this[_resolvedFromRepo](h.git() || h.https() || h.sshurl())
      : this[_resolvedFromRepo](this.spec.fetchSpec)
  }

  [_resolvedFromRepo] (gitRemote) {
    if (!gitRemote)
      return Promise.reject(new Error(`No git url for ${this.spec}`))
    const gitRange = this.spec.gitRange
    const name = this.spec.name
    return git.revs(gitRemote, this.opts).then(remoteRefs => {
      return !remoteRefs
        ? Promise.reject(new Error(`Could not resolve git ref for ${this.spec}`))
        : gitRange ? pickManifest({
          versions: remoteRefs.versions,
          'dist-tags': remoteRefs['dist-tags'],
          name,
        }, gitRange, this.opts)
        : this.spec.gitCommittish ? Promise.resolve(
          remoteRefs.refs[this.spec.gitCommittish] ||
          remoteRefs.refs[remoteRefs.shas[this.spec.gitCommittish]]
        )
        : null // have to do a clone to get the default branch
    }).then(revDoc => {
      if (!revDoc)
        return this[_resolvedFromClone]()

      this.resolvedRef = revDoc
      this.resolvedSha = revDoc.sha
      this[_addGitSha](revDoc.sha)
      return this.resolved
    })
  }

  [_setResolvedWithSha] (withSha) {
    // we haven't cloned, so a tgz download is still faster
    // of course, if it's not a known host, we can't do that.
    this.resolved = !this.spec.hosted ? withSha
      : npa(withSha).hosted.tarball({ noCommittish: false })
  }

  // when we get the git sha, we affix it to our spec to build up
  // either a git url with a hash, or a tarball download URL
  [_addGitSha] (sha) {
    if (this.spec.hosted) {
      this[_setResolvedWithSha](
        this.spec.hosted.shortcut({ noCommittish: true }) + '#' + sha
      )
    } else {
      const u = url.parse(this.spec.rawSpec)
      u.hash = '#' + sha
      delete u.href
      this[_setResolvedWithSha](url.format(u))
    }
  }

  [_resolvedFromClone] () {
    // do a full or shallow clone, then look at the HEAD
    // kind of wasteful, but no other option, really
    return this[_clone](dir => this.resolved)
  }

  [_tarballFromResolved] () {
    // if we're resolved, and it's a tarball url, shell out to RemoteFetcher
    if (this.spec.hosted && this.resolved.match(/^https?:\/\//)) {
      const nameat = this.spec.name ? `${this.spec.name}@` : ''
      return new RemoteFetcher(this.resolved, {
        ...this.opts,
        pkgid: `git:${nameat}${this.resolved}`,
        resolved: this.resolved,
      })[_tarballFromResolved]()
    }

    // check it out and then shell out to the DirFetcher tarball packer
    const stream = new Minipass()
    stream.resolved = this.resolved
    this[_clone](dir => new Promise((res, rej) => {
      const df = new DirFetcher(`file:${dir}`, {
        ...this.opts,
        resolved: null,
        integrity: null,
      })
      const dirStream = df[_tarballFromResolved]()
      dirStream.on('error', er => rej(er))
      dirStream.on('end', () => res())
      dirStream.pipe(stream)
    })).catch(er => stream.emit('error', er))
    return stream
  }

  // clone a git repo into a temp folder.
  // bandler accepts a directory, and returns a promise that resolves
  // when we're done with it, at which point, cacache deletes it
  [_clone] (handler) {
    const o = { tmpPrefix: 'git-clone' }
    const ref = this.resolvedSha || this.spec.gitCommittish

    return cacache.tmp.withTmp(this.cache, o, tmp => {
      const h = this.spec.hosted
      const clone = this.resolvedRef && h && SHALLOW_HOSTS.has(h.type)
        ? 'shallow' : 'clone'
      const repo = h && !this.spec.fetchSpec ? h.git({ noCommittish: true })
        : this.spec.fetchSpec
      return git[clone](repo, ref, tmp, this.opts).then(sha => {
        this.resolvedSha = sha
        if (!this.resolved)
          this[_addGitSha](sha)
        return tmp
      }).then(() => handler(tmp))
    })
  }

  manifest () {
    return this.spec.hosted && this.resolved
      ? FileFetcher.prototype.manifest.apply(this)
      : this[_clone](dir => {
          readPackageJson(dir + '/package.json')
            .then(mani => ({
              ...mani,
              _integrity: String(this.integrity),
              _resolved: this.resolved,
            }))
        })
  }

  packument () {
    return FileFetcher.prototype.packument.apply(this)
  }
}
module.exports = GitFetcher
