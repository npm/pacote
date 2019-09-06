const t = require('tap')
const osenv = require('osenv')

osenv.tmpdir = () => '/tmp'
osenv.home = () => '/home/isaacs'
const path = require('path')
path.resolve = path.posix.resolve
process.getuid = () => 69420
process.env.APPDATA = ''
const isWindows = process.platform === 'win32'
const posix = isWindows ? 'posix' : null
const windows = isWindows ? null : 'win32'

const cacheDir = require('../../lib/util/cache-dir.js')

// call it once just to cover the default arg setting
// the tests all specify something, so they work predictably
// on all platforms.
t.ok(cacheDir(), 'a cache dir is ok')

t.equal(cacheDir(posix), '/home/isaacs/.npm')
t.equal(cacheDir(windows), '/home/isaacs/npm-cache')

osenv.home = () => null
t.equal(cacheDir(posix), '/tmp/npm-69420/.npm')
t.equal(cacheDir(windows), '/tmp/npm-69420/npm-cache')

process.env.APPDATA = '/%APPDATA%'
t.equal(cacheDir(windows), '/%APPDATA%/npm-cache')

process.getuid = null
t.equal(cacheDir(posix), `/tmp/npm-${process.pid}/.npm`)
