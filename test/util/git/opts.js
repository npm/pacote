const t = require('tap')
const gitOpts = require('../../../lib/util/git/opts.js')
const gitEnv = require('../../../lib/util/git/env.js')
t.match(gitOpts({
  foo: 'bar',
  env: { override: 'for some reason' },
}, {
  uid: 420,
  gid: 69,
  abc: 'def',
}), {
  foo: 'bar',
  env: { override: 'for some reason' },
  uid: 420,
  gid: 69,
  abc: undefined,
}, 'copied relevant opts, not irrelevant ones')

t.match(gitOpts().env, gitEnv(), 'got the git env by default')
