const t = require('tap')
const path = require('node:path')
process.getuid = () => 69420
process.env.LOCALAPPDATA = ''
const isWindows = process.platform === 'win32'
const posix = isWindows ? 'posix' : null
const windows = isWindows ? null : 'win32'

let homedir = '/home/isaacs'
const cacheDir = t.mock('../../lib/util/cache-dir.js', {
  'node:path': {
    resolve: path.posix.resolve,
  },
  'node:os': {
    tmpdir: () => '/tmp',
    homedir: () => homedir,
  },
})

// call it once just to cover the default arg setting
// the tests all specify something, so they work predictably
// on all platforms.
t.ok(cacheDir(), 'a cache dir is ok')

t.equal(cacheDir(posix).cacache, '/home/isaacs/.npm/_cacache')
t.equal(cacheDir(windows).cacache, '/home/isaacs/npm-cache/_cacache')
t.equal(cacheDir(posix).tufcache, '/home/isaacs/.npm/_tuf')
t.equal(cacheDir(windows).tufcache, '/home/isaacs/npm-cache/_tuf')

homedir = null
t.equal(cacheDir(posix).cacache, '/tmp/npm-69420/.npm/_cacache')
t.equal(cacheDir(windows).cacache, '/tmp/npm-69420/npm-cache/_cacache')
t.equal(cacheDir(posix).tufcache, '/tmp/npm-69420/.npm/_tuf')
t.equal(cacheDir(windows).tufcache, '/tmp/npm-69420/npm-cache/_tuf')

process.env.LOCALAPPDATA = '/%LOCALAPPDATA%'
t.equal(cacheDir(windows).cacache, '/%LOCALAPPDATA%/npm-cache/_cacache')
t.equal(cacheDir(windows).tufcache, '/%LOCALAPPDATA%/npm-cache/_tuf')

process.getuid = null
t.equal(cacheDir(posix).cacache, `/tmp/npm-${process.pid}/.npm/_cacache`)
t.equal(cacheDir(posix).tufcache, `/tmp/npm-${process.pid}/.npm/_tuf`)
