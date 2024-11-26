const t = require('tap')
const isPackageBin = require('../../lib/util/is-package-bin.js')
const path = require('path').posix

t.ok(isPackageBin({ bin: 'foo' }, 'package/foo'), 'finds string')
t.ok(isPackageBin({ bin: { bar: 'foo' } }, 'package/foo'), 'finds in obj')
t.notOk(isPackageBin(null, 'anything'), 'return false if pkg is not')
t.notOk(isPackageBin({ bin: 'foo' }, 'package/bar'), 'not the bin string')
t.notOk(isPackageBin({ bin: { bar: 'foo' } }, 'package/bar'), 'not in obj')

t.test('bin file not recognized without prefix removal', t => {
  const testPkg = { name: 'my-package', bin: 'bin/index.js' }
  const testFilePath = 'package/bin/index.js' // includes 'package/' prefix

  // Simulate isPackageBin without prefix removal
  const faultyIsPackageBin = (pkg, filePath) => {
    const bin = typeof pkg.bin === 'string' ? { [pkg.name]: pkg.bin } : pkg.bin
    const normalizedFilePath = path.normalize(filePath) // No prefix removal
    for (const binPath of Object.values(bin)) {
      const normalizedBinPath = path.normalize(binPath)
      if (normalizedFilePath === normalizedBinPath) {
        return true
      }
    }
    return false
  }

  t.notOk(faultyIsPackageBin(testPkg, testFilePath),
    'fails to recognize bin file without prefix removal')
  t.ok(isPackageBin(testPkg, testFilePath), 'correctly recognizes bin file with prefix removal')
  t.end()
})
