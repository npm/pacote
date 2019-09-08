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

const npm = require('../../lib/util/npm.js')
t.test('do the things', t => {
  t.pass('wtf')
  t.resolveMatchSnapshot(npm('/path/to/npm/bin/npm-cli.js', 'flerb', '/cwd', 'oopsie'))
  t.resolveMatchSnapshot(npm('/path/to/npm', 'flerb', '/cwd', 'oopsie'))
  t.end()
})
cp.spawn = spawn
