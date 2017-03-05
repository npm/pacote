'use strict'

const BB = require('bluebird')

const checksumStream = require('checksum-stream')
const dezalgo = require('dezalgo')
const finished = require('mississippi').finished
const gunzip = require('./util/gunzip-maybe')
const minimatch = require('minimatch')
const normalize = require('normalize-package-data')
const optCheck = require('./util/opt-check')
const path = require('path')
const pipe = require('mississippi').pipe
const pipeline = require('mississippi').pipeline
const tar = require('tar-stream')
const through = require('mississippi').through

module.exports = finalizeManifest
function finalizeManifest (pkg, spec, opts) {
  return BB.fromNode(cb => {
    tarballedProps(pkg, spec, opts, (err, props) => {
      if (err) { return cb(err) }
      // normalize should not add any fields, and once
      // makeManifest completes, it should never be modified.
      cb(null, new Manifest(pkg, props))
    })
  })
}

module.exports.Manifest = Manifest
function Manifest (pkg, fromTarball) {
  fromTarball = fromTarball || {}
  this.name = pkg.name
  this.version = pkg.version
  this.dependencies = pkg.dependencies || {}
  this.optionalDependencies = pkg.optionalDependencies || {}
  this.devDependencies = pkg.devDependencies || {}
  const bundled = (
    pkg.bundledDependencies ||
    pkg.bundleDependencies ||
    false
  )
  this.bundleDependencies = bundled
  this.peerDependencies = pkg.peerDependencies || {}

  // This one depends entirely on each handler.
  this._resolved = pkg._resolved

  // Not all handlers (or registries) provide these out of the box,
  // and if they don't, we need to extract and read the tarball ourselves.
  // These are details required by the installer.
  this._shasum = pkg._shasum || fromTarball._shasum
  this._shrinkwrap = pkg._shrinkwrap || fromTarball._shrinkwrap || null
  this.bin = pkg.bin || fromTarball.bin || null

  if (this.bin && Array.isArray(this.bin)) {
    // Code yanked from read-package-json.
    const m = pkg.directories && pkg.directories.bin || '.'
    this.bin = this.bin.reduce((acc, mf) => {
      if (mf && mf.charAt(0) !== '.') {
        const f = path.basename(mf)
        acc[f] = path.join(m, mf)
      }
      return acc
    }, {})
  }

  this._id = null // filled in by normalize-package-data, but unnecessary

  // TODO - freezing and inextensibility pending npm changes. See test suite.
  // Object.preventExtensions(this)
  normalize(this)

  // I don't want this why did you give it to me. Go away. 🔥🔥🔥🔥
  delete this.readme

  // Object.freeze(this)
}

// Some things aren't filled in by standard manifest fetching.
// If this function needs to do its work, it will grab the
// package tarball, extract it, and take whatever it needs
// from the stream.
function tarballedProps (pkg, spec, opts, cb) {
  cb = dezalgo(cb)
  const extraProps = {}
  const needsShrinkwrap = (
    pkg._hasShrinkwrap !== false &&
    !pkg._shrinkwrap
  )
  const needsBin = !!(
    !pkg.bin &&
    pkg.directories &&
    pkg.directories.bin
  )
  const needsShasum = !pkg._shasum
  if (!needsShrinkwrap && !needsBin && !needsShasum) {
    opts.log.silly('finalize-manifest', 'Skipping tarball extraction -- nothing needed.')
    return cb(null, extraProps)
  } else {
    opts = optCheck(opts)
    opts.memoize = false
    const tarball = require('./handlers/' + spec.type + '/tarball')
    const tarData = tarball.fromManifest(pkg, spec, opts)
    let shaStream = null
    let extractorStream = null

    if (needsShrinkwrap || needsBin) {
      opts.log.silly('finalize-manifest', 'parsing tarball for', spec.name)
      const dirBin = pkg.directories && pkg.directories.bin
      extraProps.bin = pkg.bin || {}
      const dataStream = tar.extract()
      extractorStream = pipeline(gunzip(), dataStream)
      dataStream.on('entry', (header, fileStream, next) => {
        const filePath = header.name.replace(/[^/]+\//, '')
        if (needsShrinkwrap && filePath === 'npm-shrinkwrap.json') {
          let srData = ''
          fileStream.on('data', d => { srData += d })

          return finished(fileStream, err => {
            if (err) { return dataStream.emit('error', err) }
            try {
              extraProps._shrinkwrap = JSON.parse(srData)
              next()
            } catch (e) {
              dataStream.emit('error', e)
            }
          })
        } else if (needsBin && minimatch(filePath, dirBin + '/**')) {
          const relative = path.relative(dirBin, filePath)
          if (relative && relative[0] !== '.') {
            extraProps.bin[path.basename(relative)] = path.join(dirBin, relative)
          }
        }
        // Drain and get next one
        fileStream.on('data', () => {})
        next()
      })
    } else {
      extractorStream = through()
    }
    if (needsShasum) {
      shaStream = checksumStream({
        algorithm: opts.hashAlgorithm
      })
      shaStream.on('digest', d => {
        extraProps._shasum = d
      })
    } else {
      shaStream = through()
    }
    // Drain the end stream
    extractorStream.on('data', () => {})
    return pipe(tarData, shaStream, extractorStream, err => {
      cb(err, extraProps)
    })
  }
}
