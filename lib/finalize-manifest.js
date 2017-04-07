'use strict'

const BB = require('bluebird')

const cache = require('./cache')
const finished = require('mississippi').finished
const gunzip = require('./util/gunzip-maybe')
const minimatch = require('minimatch')
const normalize = require('normalize-package-data')
const optCheck = require('./util/opt-check')
const PassThrough = require('stream').PassThrough
const path = require('path')
const pipe = require('mississippi').pipe
const pipeline = require('mississippi').pipeline
const ssri = require('ssri')
const tar = require('tar-stream')

module.exports = finalizeManifest
function finalizeManifest (pkg, spec, opts) {
  const key = finalKey(pkg, spec)
  opts = optCheck(opts)
  opts.memoize = true
  return ((opts.cache && key && !opts.preferOnline) ? cache.get.info(opts.cache, key, opts).then(res => {
    if (!res) { throw new Error('cache miss') }
    return new Manifest(res.metadata)
  }) : BB.reject(new Error('nope'))).catch(() => {
    return BB.fromNode(cb => {
      tarballedProps(pkg, spec, opts, function (err, props) {
        if (err) { return cb(err) }
        // normalize should not add any fields, and once
        // makeManifest completes, it should never be modified.
        var result = pkg && pkg.name
        ? new Manifest(pkg, props)
        : new Manifest(props)
        if (opts.cache) {
          opts.metadata = result
          cache.put(
            opts.cache, key || finalKey(result, spec), '.', opts
          ).then(() => cb(null, result), cb)
        } else {
          cb(null, result)
        }
      })
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
  this.deprecated = pkg.deprecated || false

  // These depend entirely on each handler
  this._resolved = pkg._resolved

  // Not all handlers (or registries) provide these out of the box,
  // and if they don't, we need to extract and read the tarball ourselves.
  // These are details required by the installer.
  this._integrity = pkg._integrity || fromTarball._integrity
  this._shrinkwrap = pkg._shrinkwrap || fromTarball._shrinkwrap || null
  this.bin = pkg.bin || fromTarball.bin || null

  if (this.bin && Array.isArray(this.bin)) {
    // Code yanked from read-package-json.
    const m = (pkg.directories && pkg.directories.bin) || '.'
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
  const extraProps = {}
  const needsShrinkwrap = (!pkg || (
    pkg._hasShrinkwrap !== false &&
    !pkg._shrinkwrap
  ))
  const needsBin = !!(!pkg || (
    !pkg.bin &&
    pkg.directories &&
    pkg.directories.bin
  ))
  const needsHash = !pkg || !pkg._integrity
  const needsManifest = !pkg || !pkg.name
  if (!needsShrinkwrap && !needsBin && !needsHash && !needsManifest) {
    opts.log.silly('finalize-manifest', 'Skipping tarball extraction -- nothing needed.')
    return cb(null, extraProps)
  } else {
    opts = optCheck(opts)
    opts.memoize = false
    const tarball = require('./handlers/' + spec.type + '/tarball')
    const tarData = tarball.fromManifest(pkg, spec, opts)
    let shaStream = null
    let extractorStream = null
    let paths = []

    if (needsShrinkwrap || needsBin || needsManifest) {
      opts.log.silly('finalize-manifest', 'parsing tarball for', spec.name)
      const dataStream = tar.extract()
      extractorStream = pipeline(gunzip(), dataStream)
      dataStream.on('entry', (header, fileStream, next) => {
        const filePath = header.name.replace(/[^/]+\//, '')
        if (
          (needsShrinkwrap && filePath === 'npm-shrinkwrap.json') ||
          (needsManifest && filePath === 'package.json')
        ) {
          let data = ''
          fileStream.on('data', d => { data += d })

          return finished(fileStream, err => {
            if (err) { return dataStream.emit('error', err) }
            let parsed
            try {
              parsed = JSON.parse(data)
              next()
            } catch (e) {
              dataStream.emit('error', e)
            }
            if (filePath === 'package.json') {
              Object.keys(parsed).forEach(k => {
                if (extraProps[k] == null) {
                  extraProps[k] = parsed[k]
                }
              })
              extraProps._resolved = spec.spec
            } else if (filePath === 'npm-shrinkwrap.json') {
              extraProps._shrinkwrap = parsed
            }
          })
        } else if (needsBin) {
          paths.push(filePath)
        }
        // Drain and get next one
        fileStream.on('data', () => {})
        next()
      })
    } else {
      extractorStream = new PassThrough()
    }
    if (needsHash) {
      shaStream = ssri.integrityStream({
        algorithms: ['sha1']
      })
      shaStream.on('integrity', int => {
        extraProps._integrity = int.toString()
      })
    } else {
      shaStream = new PassThrough()
    }
    // Drain the end stream
    extractorStream.on('data', () => {})
    return pipe(tarData, shaStream, extractorStream, err => {
      if (needsBin) {
        const dirBin = pkg
        ? (pkg.directories && pkg.directories.bin)
        : (extraProps.directories && extraProps.directories.bin)
        extraProps.bin = {}
        Object.keys((pkg && pkg.bin) || {}).forEach(k => {
          extraProps.bin[k] = pkg.bin[k]
        })
        paths.forEach(filePath => {
          if (minimatch(filePath, dirBin + '/**')) {
            const relative = path.relative(dirBin, filePath)
            if (relative && relative[0] !== '.') {
              extraProps.bin[path.basename(relative)] = path.join(dirBin, relative)
            }
          }
        })
      }
      cb(err, extraProps)
    })
  }
}

function finalKey (pkg, spec) {
  if (pkg && pkg._uniqueResolved) {
    // git packages have a unique, identifiable id, but no tar sha
    return cache.key(`${spec.type}-manifest`, pkg._uniqueResolved)
  } else {
    return (
      pkg && pkg._integrity &&
      cache.key(
        `${spec.type}-manifest`,
        `${pkg._resolved}:${ssri.stringify(pkg._integrity)}`
      )
    )
  }
}
