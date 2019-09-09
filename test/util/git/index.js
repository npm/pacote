const git = require('../../../lib/util/git/index.js')
const t = require('tap')
t.match(git, {
  clone: Function,
  revs: Function,
  spawn: Function,
})
