'use strict'

const BB = require('bluebird')

const glob = BB.promisify(require('glob'))
const path = require('path')

const readFileAsync = BB.promisify(require('fs').readFile)

module.exports = manifest
function manifest (spec, opts) {
  const pkgPath = path.join(spec.fetchSpec, 'package.json')
  const srPath = path.join(spec.fetchSpec, 'npm-shrinkwrap.json')
  return BB.join(
    readFileAsync(pkgPath).then(JSON.parse).catch({code: 'ENOENT'}, err => {
      err.code = 'ENOPACKAGEJSON'
      throw err
    }),
    readFileAsync(srPath).then(JSON.parse).catch({code: 'ENOENT'}, () => null),
    (pkg, sr) => {
      pkg._shrinkwrap = sr
      pkg._hasShrinkwrap = !!sr
      pkg._resolved = spec.fetchSpec
      pkg._integrity = false // Don't auto-calculate integrity
      return pkg
    }
  ).then(pkg => {
    if (!pkg.bin && pkg.directories && pkg.directories.bin) {
      const dirBin = pkg.directories.bin
      return glob(path.join(spec.fetchSpec, dirBin, '/**'), {nodir: true}).then(matches => {
        matches.forEach(filePath => {
          const relative = path.relative(spec.fetchSpec, filePath)
          if (relative && relative[0] !== '.') {
            if (!pkg.bin) { pkg.bin = {} }
            pkg.bin[path.basename(relative)] = relative
          }
        })
      }).then(() => pkg)
    } else {
      return pkg
    }
  })
}
