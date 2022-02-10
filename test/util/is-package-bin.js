const isPackageBin = require('../../lib/util/is-package-bin.js')
const t = require('tap')

t.ok(isPackageBin({ bin: 'foo' }, 'package/foo'), 'finds string')
t.ok(isPackageBin({ bin: { bar: 'foo' } }, 'package/foo'), 'finds in obj')
t.notOk(isPackageBin(null, 'anything'), 'return false if pkg is not')
t.notOk(isPackageBin({ bin: 'foo' }, 'package/bar'), 'not the bin string')
t.notOk(isPackageBin({ bin: { bar: 'foo' } }, 'package/bar'), 'not in obj')
