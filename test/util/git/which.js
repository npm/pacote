const t = require('tap')
const mungePath = process.argv[2] === 'mungePath'

if (mungePath) {
  // munge path so git env is not found
  const PATH = process.env.PATH
  process.env.PATH = __dirname
}

const whichGit = require('../../../lib/util/git/which.js')
t.equal(whichGit({ git: 'foo' }), 'foo')
if (mungePath)
  t.equal(whichGit(), null)
else {
  const which = require('which')
  t.equal(whichGit(), which.sync('git'))
  t.spawn(process.execPath, [__filename, 'mungePath'])
}
