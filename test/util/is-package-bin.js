const t = require('tap')
const isPackageBin = require('../../lib/util/is-package-bin.js')

t.ok(isPackageBin({ bin: 'foo' }, 'package/foo'), 'finds string')
t.ok(isPackageBin({ bin: { bar: 'foo' } }, 'package/foo'), 'finds in obj')
t.notOk(isPackageBin(null, 'anything'), 'return false if pkg is not')
t.notOk(isPackageBin({ bin: 'foo' }, 'package/bar'), 'not the bin string')
t.notOk(isPackageBin({ bin: { bar: 'foo' } }, 'package/bar'), 'not in obj')

t.test('bin file not recognized without prefix removal', t => {
  const testPkg = { name: 'my-package', bin: 'bin/index.js' }
  const testFilePath = 'bin/index.js' // includes 'package/' prefix
  t.ok(isPackageBin(testPkg, testFilePath, false),
    'correctly recognizes bin file with prefix removal')
  t.end()
})
