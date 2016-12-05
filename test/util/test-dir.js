var mkdirp = require('mkdirp')
var path = require('path')
var rimraf = require('rimraf')
var tap = require('tap')

var cacheDir = path.resolve(__dirname, '../cache')

module.exports = testDir
function testDir (filename) {
  var dir = path.join(cacheDir, path.basename(filename, '.js'))
  reset(dir)
  if (!process.env.KEEPCACHE) {
    tap.tearDown(function () {
      process.chdir(__dirname)
      try {
        rimraf.sync(cacheDir)
      } catch (e) {
        if (process.platform !== 'win32') {
          throw e
        }
      }
    })
    tap.afterEach(function (cb) {
      reset(dir)
      cb()
    })
  }
  return dir
}

module.exports.reset = reset
function reset (testDir) {
  process.chdir(__dirname)
  try {
    rimraf.sync(testDir)
  } catch (e) {
    if (process.platform !== 'win32') {
      throw e
    }
  }
  mkdirp.sync(testDir)
  process.chdir(testDir)
}
