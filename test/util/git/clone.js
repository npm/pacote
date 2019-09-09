const shallow = require.resolve('../../../lib/util/git/shallow.js')
const full = require.resolve('../../../lib/util/git/full.js')
const requireInject = require('require-inject')
const clone = requireInject('../../../lib/util/git/clone.js', {
  [full]: () => 'full',
  [shallow]: () => 'shallow',
})

const t = require('tap')
t.equal(clone('git://github.com/foo/bar', '', '', '', 'ref'), 'shallow')
t.equal(clone('git://other-host.com/foo/bar', '', '', '', 'ref'), 'full')
t.equal(clone('git://github.com/foo/bar', '', '', '', null), 'full')
