const t = require('tap')
const os = require('os')

os.tmpdir = () => '/tmp'
os.homedir = () => '/home/isaacs'
const path = require('path')
path.resolve = path.posix.resolve
process.getuid = () => 69420
process.env.LOCALAPPDATA = ''
const isWindows = process.platform === 'win32'
const posix = isWindows ? 'posix' : null
const windows = isWindows ? null : 'win32'

const cacheDir = require('../../lib/util/cache-dir.js')

// call it once just to cover the default arg setting
// the tests all specify something, so they work predictably
// on all platforms.
t.ok(cacheDir(), 'a cache dir is ok')

t.equal(cacheDir(posix), '/home/isaacs/.npm/_cacache')
t.equal(cacheDir(windows), '/home/isaacs/npm-cache/_cacache')

os.homedir = () => null
t.equal(cacheDir(posix), '/tmp/npm-69420/.npm/_cacache')
t.equal(cacheDir(windows), '/tmp/npm-69420/npm-cache/_cacache')

process.env.LOCALAPPDATA = '/%LOCALAPPDATA%'
t.equal(cacheDir(windows), '/%LOCALAPPDATA%/npm-cache/_cacache')

process.getuid = null
t.equal(cacheDir(posix), `/tmp/npm-${process.pid}/.npm/_cacache`)
