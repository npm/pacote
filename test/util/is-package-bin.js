const t = require('tap')
const isPackageBin = require('../../lib/util/is-package-bin.js')

t.ok(isPackageBin({ bin: 'foo' }, 'foo'), 'finds string')
t.ok(isPackageBin({ bin: { bar: 'foo' } }, 'foo'), 'finds in obj')
t.notOk(isPackageBin(null, 'anything'), 'return false if pkg is not')
t.notOk(isPackageBin({ bin: 'foo' }, 'bar'), 'not the bin string')
t.notOk(isPackageBin({ bin: { bar: 'foo' } }, 'bar'), 'not in obj')
t.ok(isPackageBin({ bin: 'bin/index.js' }, 'bin/index.js'), 'finds nested string')
t.ok(isPackageBin({ bin: { foo: 'package/bin/index.js' } }, 'package/bin/index.js'),
  'finds a bin in a directory named package')
t.notOk(isPackageBin({ bin: 'bin/index.js' }, 'src/bin/index.js'), 'does not discard a directory')
