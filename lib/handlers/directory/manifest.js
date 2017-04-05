'use strict'

const BB = require('bluebird')

const glob = BB.promisify(require('glob'))
const path = require('path')

const readFileAsync = BB.promisify(require('fs').readFile)

module.exports = manifest
function manifest (spec, opts) {
  const pkgPath = path.join(spec.spec, 'package.json')
  const srPath = path.join(spec.spec, 'npm-shrinkwrap.json')
  return BB.join(
    readFileAsync(pkgPath).then(JSON.parse).catch({code: 'ENOENT'}, err => {
      err.code = 'ENOPACKAGEJSON'
      throw err
    }),
    readFileAsync(srPath).then(JSON.parse).catch({code: 'ENOENT'}, () => null),
    (pkg, sr) => {
      pkg._shrinkwrap = sr
      pkg._hasShrinkwrap = !!sr
      pkg._integrity = 'directory manifests have no shasum'
      return pkg
    }
  ).then(pkg => {
    if (!pkg.bin && pkg.directories && pkg.directories.bin) {
      const dirBin = pkg.directories.bin
      return glob(path.join(spec.spec, dirBin, '/**')).then(matches => {
        matches.forEach(filePath => {
          const relative = path.relative(dirBin, filePath)
          if (relative && relative[0] !== '.') {
            if (!pkg.bin) { pkg.bin = {} }
            pkg.bin[path.basename(relative)] = path.join(dirBin, relative)
          }
        })
      })
    } else {
      return pkg
    }
  })
}
