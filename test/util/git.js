'use strict'

const BB = require('bluebird')

const cp = BB.promisifyAll(require('child_process'))
const git = require('../../lib/util/git')
const mkdirp = BB.promisify(require('mkdirp'))
const retry = require('promise-retry')

module.exports = mockRepo
function mockRepo (opts) {
  opts = opts || {}
  const cwd = opts.cwd || process.cwd()
  return mkdirp(cwd).then(() => {
    return git._exec(['init'], { cwd })
  }).then(() => {
    return git._exec(['add', '.'], { cwd })
  }).then(() => {
    return git._exec(['commit', '-m', 'initial commit', '--no-gpg-sign'], { cwd })
  }).then(() => {
    return daemon(opts)
  })
}

const PORT = 1234

module.exports.daemon = daemon
function daemon (opts) {
  opts = opts || {}

  return BB.resolve(retry((tryAgain, attempt) => {
    let stderr = ''
    const port = (opts.port || PORT) + attempt
    return BB.fromNode(cb => {
      const srv = cp.spawn('git', [
        'daemon',
        '--verbose',
        '--listen=localhost',
        `--port=${port}`,
        '--reuseaddr',
        '--export-all',
        '--base-path=.'
      ], {
        cwd: opts.cwd || process.cwd()
      })
      srv.stderr.on('data', d => {
        const str = d.toString('utf8')
        stderr += str
        const match = str.match(/\[(\d+)\] Ready to rumble/i)
        if (match) {
          srv.pid = parseInt(match[1])
          srv.port = port
          cb(null, srv)
        }
      })
      srv.once('exit', cb)
      srv.once('error', cb)
    })
      .then(srv => {
        return srv
      }, e => {
        if (stderr.match(/already in use/i)) {
          return tryAgain(e)
        } else {
          throw e
        }
      })
  }, { factor: 1, minTimeout: 100 }))
    .disposer(srv => BB.fromNode(cb => {
      srv.on('error', cb)
      srv.on('close', cb)
      srv.kill()
    }))
}
