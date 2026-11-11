// Function to determine whether a package-relative path is in the package.bin set.
// Used to prevent issues when people publish a package from a
// windows machine, and then install with --no-bin-links.
//
// Note: this is not possible in remote or file fetchers, since
// we don't have the manifest until AFTER we've unpacked.  But the
// main use case is registry fetching with git a distant second,
// so that's an acceptable edge case to not handle.

const binObj = (name, bin) =>
  typeof bin === 'string' ? { [name]: bin } : bin

const hasBin = (pkg, path) => {
  const bin = binObj(pkg.name, pkg.bin)
  for (const kv of Object.entries(bin)) {
    if (kv[1] === path) {
      return true
    }
  }
  return false
}

module.exports = (pkg, path) =>
  pkg && pkg.bin ? hasBin(pkg, path) : false
