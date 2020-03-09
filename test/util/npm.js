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

t.cleanSnapshot = s => s.split(process.execPath).join('{NODE}')

const npm = require('../../lib/util/npm.js')
t.test('do the things', t => {
  t.pass('wtf')
  t.resolveMatchSnapshot(npm('/path/to/npm/bin/npm-cli.js', 'flerb', '/cwd', { message: 'oopsie' }))
  t.resolveMatchSnapshot(npm('/path/to/npm', 'flerb', '/cwd', { message: 'oopsie' }))
  t.end()
})
cp.spawn = spawn
