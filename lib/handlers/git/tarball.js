'use strict'

const BB = require('bluebird')

const cache = require('../../cache')
const git = require('../../util/git')
const mkdirp = BB.promisify(require('mkdirp'))
const optCheck = require('../../util/opt-check')
const osenv = require('osenv')
const path = require('path')
const pipe = BB.promisify(require('mississippi').pipe)
const rimraf = BB.promisify(require('rimraf'))
const tar = require('tar-fs')
const through = require('mississippi').through
const to = require('mississippi').to
const uniqueFilename = require('unique-filename')

const gitManifest = require('./manifest')

module.exports = tarball
function tarball (spec, opts) {
  opts = optCheck(opts)
  let streamErr = null
  const stream = through().on('error', e => { streamErr = e })
  gitManifest(spec, opts).then(manifest => {
    if (streamErr) { throw streamErr }
    return pipe(fromManifest(manifest, spec, opts), stream)
  })
  return stream
}

module.exports.fromManifest = fromManifest
function fromManifest (manifest, spec, opts) {
  opts = optCheck(opts)
  let streamError
  const stream = through().on('error', e => { streamError = e })
  const cacheStream = (
    opts.cache &&
    cache.get.stream(
      opts.cache, cache.key('git-clone', manifest._resolved), opts
    )
  )
  cacheStream.pipe(stream)
  cacheStream.on('error', err => {
    if (err.code !== 'ENOENT') {
      return stream.emit('error', err)
    } else {
      stream.emit('reset')
      withTmp(opts, tmp => {
        if (streamError) { throw streamError }
        return cloneRepo(
          manifest._repo, manifest._ref, manifest._rawRef, tmp, opts
        ).then(HEAD => {
          if (streamError) { throw streamError }
          return packDir(spec, manifest._resolved, tmp, stream, opts)
        })
      }).catch(err => stream.emit('error', err))
    }
  })
  return stream
}

function withTmp (opts, cb) {
  if (opts.cache) {
    // cacache has a special facility for working in a tmp dir
    return cache.tmp.withTmp(opts.cache, opts, cb)
  } else {
    const tmpDir = path.join(osenv.tmpdir(), 'pacote-git-tmp')
    const tmpName = uniqueFilename(tmpDir, 'git-clone')
    const tmp = mkdirp(tmpName).then(() => tmpName).disposer(rimraf)
    return BB.using(tmp, cb)
  }
}

function cloneRepo (repo, resolvedRef, rawRef, tmp, opts) {
  if (resolvedRef) {
    return git.shallow(repo, resolvedRef.ref, tmp, opts)
  } else {
    return git.clone(repo, rawRef, tmp, opts)
  }
}

function packDir (spec, label, tmp, target, opts) {
  opts = optCheck(opts)

  const packer = opts.gitPacker
  ? opts.gitPacker(spec, tmp)
  : tar.pack(tmp, {
    map: header => {
      header.name = 'package/' + header.name
    },
    ignore: (name) => {
      name.match(/\.git/)
    }
  })

  if (!opts.cache) {
    return pipe(packer, target)
  } else {
    const cacher = cache.put.stream(
      opts.cache, cache.key('git-clone', label), opts
    )
    cacher.once('error', err => packer.emit('error', err))
    target.once('error', err => packer.emit('error', err))
    packer.once('error', err => {
      cacher.emit('error', err)
      target.emit('error', err)
    })
    return pipe(packer, to((chunk, enc, cb) => {
      cacher.write(chunk, enc, () => {
        target.write(chunk, enc, cb)
      })
    }, done => {
      cacher.end(() => {
        target.end(done)
      })
    }))
  }
}
