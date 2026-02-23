const t = require('tap')
const cp = require('node:child_process')
const EventEmitter = require('node:events')
const { Minipass } = require('minipass')
const cleanSnapshot = require('../helpers/clean-snapshot.js')

const { spawn } = cp

cp.spawn = (...args) => {
  const proc = new EventEmitter()
  proc.stdout = new Minipass()
  proc.stdout.end(JSON.stringify(args))
  proc.stdout.on('end', () => setTimeout(() => proc.emit('close')))
  return proc
}
t.teardown = () => cp.spawn = spawn

t.cleanSnapshot = str => cleanSnapshot(str)

const npm = require('../../lib/util/npm.js')
t.test('do the things', t => {
  const env = { environmental: 'variables' }
  t.resolveMatchSnapshot(
    npm('/path/to/npm/bin/npm-cli.js', 'flerb', '/cwd', env, { message: 'oopsie' }))
  t.resolveMatchSnapshot(npm('/path/to/npm', 'flerb', '/cwd', env, { message: 'oopsie' }))
  t.end()
})

t.test('strips npm_config_min_release_age from env when --before is in args', async t => {
  const spawnCalls = []
  const npmWithMock = t.mock('../../lib/util/npm.js', {
    '@npmcli/promise-spawn': (cmd, args, opts, extra) => {
      spawnCalls.push({ cmd, args, opts, extra })
      return Promise.resolve({ stdout: '', stderr: '', code: 0, signal: null })
    },
  })

  const env = {
    npm_config_min_release_age: '2',
    other_var: 'kept',
  }
  const npmCommand = ['install', '--force', '--before=2026-02-18T09:43:39.679Z']
  await npmWithMock('npm', npmCommand, '/cwd', env, { message: 'oops' })

  t.ok(spawnCalls.length > 0, 'spawn was called')
  const lastCall = spawnCalls[spawnCalls.length - 1]
  t.ok(
    lastCall.args.some(a => typeof a === 'string' && a.startsWith('--before=')),
    'args include --before'
  )
  const hasMinReleaseAge = Object.keys(lastCall.opts.env || {}).some(
    k => k.toLowerCase() === 'npm_config_min_release_age'
  )
  t.notOk(hasMinReleaseAge, 'env must not contain npm_config_min_release_age')
  t.ok('other_var' in (lastCall.opts.env || {}), 'other env vars are preserved')
})
