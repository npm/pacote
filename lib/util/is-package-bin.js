const path = require('path').posix
// Function to determine whether a path is in the package.bin set.
// Used to prevent issues when people publish a package from a
// windows machine, and then install with --no-bin-links.
//
// Note: this is not possible in remote or file fetchers, since
// we don't have the manifest until AFTER we've unpacked.  But the
// main use case is registry fetching with git a distant second,
// so that's an acceptable edge case to not handle.

const binObj = (name, bin) =>
  typeof bin === 'string' ? { [name]: bin } : bin

const hasBin = (pkg, filePath) => {
  const bin = binObj(pkg.name, pkg.bin)

  // Remove 'package/' prefix if present
  const relativeFilePath = filePath.startsWith('package/')
    ? filePath.slice(8)
    : filePath

  const normalizedFilePath = path.normalize(relativeFilePath)

  for (const binName in bin) {
    const binPath = bin[binName]
    const normalizedBinPath = path.normalize(binPath)

    if (normalizedFilePath === normalizedBinPath) {
      return true
    }
  }
  return false
}

module.exports = (pkg, filePath) =>
  pkg && pkg.bin ? hasBin(pkg, filePath) : false
