'use strict'

const BB = require('bluebird')

const cp = BB.promisifyAll(require('child_process'))
const git = require('../../lib/util/git')
const mkdirp = BB.promisify(require('mkdirp'))

module.exports = mockRepo
function mockRepo (opts) {
  return mkdirp()
}

module.exports.daemon = daemon
function daemon (opts) {
  opts = opts || {}
  return BB.fromNode(cb => {
    const srv = cp.spawn('git', [
      'daemon',
      '--verbose',
      '--listen=localhost',
      `--port=${opts.port || 1234}`,
      '--reuseaddr',
      '--export-all',
      '--base-path=.'
    ], {
      cwd: opts.cwd || process.cwd()
    })
    srv.stderr.on('data', d => {
      console.warn(d.toString('utf8'))
    })
    srv.stdout.on('data', d => {
      const str = d.toString('utf8')
      const match = str.match(/\[(\d+)\]/)
      if (match) {
        srv.pid = parseInt(match[1])
        cb(null, srv)
      }
    })
    srv.once('exit', cb)
    srv.once('error', cb)
  }).disposer(srv => BB.fromNode(cb => {
    srv.on('error', cb)
    srv.on('close', cb)
    srv.kill()
  }))
}
