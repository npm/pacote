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
