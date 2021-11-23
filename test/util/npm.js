const t = require('tap')

const cp = require('child_process')
const { spawn } = cp
const Minipass = require('minipass')
const EventEmitter = require('events')
cp.spawn = (...args) => {
  const proc = new EventEmitter()
  proc.stdout = new Minipass()
  proc.stdout.end(JSON.stringify(args))
  proc.stdout.on('end', () => setTimeout(() => proc.emit('close')))
  return proc
}
t.teardown = () => cp.spawn = spawn

t.cleanSnapshot = s => s.split(process.execPath).join('{NODE}')

const npm = require('../../lib/util/npm.js')
t.test('do the things', t => {
  const env = { environmental: 'variables' }
  t.resolveMatchSnapshot(
    npm('/path/to/npm/bin/npm-cli.js', 'flerb', '/cwd', env, { message: 'oopsie' })
  )
  t.resolveMatchSnapshot(npm('/path/to/npm', 'flerb', '/cwd', env, { message: 'oopsie' }))
  t.end()
})
