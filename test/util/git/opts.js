const t = require('tap')
const gitOpts = require('../../../lib/util/git/opts.js')
const gitEnv = require('../../../lib/util/git/env.js')

t.match(gitOpts().env, gitEnv(), 'got the git env by default')

t.test('as root', t => {
  process.getuid = () => 0
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
  t.end()
})

t.test('as non-root', t => {
  process.getuid = () => 999
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
    uid: undefined,
    gid: undefined,
    abc: undefined,
  }, 'do not set uid/gid as non-root')
  t.end()
})
