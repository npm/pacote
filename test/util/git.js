'use strict'

const util = require('util')

const cp = require('child_process')
const git = require('../../lib/util/git')
const mkdirp = util.promisify(require('mkdirp'))
const retry = require('promise-retry')

module.exports = mockRepo
function mockRepo (opts) {
  opts = opts || {}
  const cwd = opts.cwd || process.cwd()
  return mkdirp(cwd)
    .then(() => {
      return git._exec(['init'], { cwd })
    })
    .then(() => {
      return git._exec(['add', '.'], { cwd })
    })
    .then(() => {
      return git._exec(['commit', '-m', 'initial commit', '--no-gpg-sign'], {
        cwd
      })
    })
    .then(() => {
      return daemon(opts)
    })
}

const PORT = 1234

module.exports.daemon = daemon
function daemon (opts) {
  opts = opts || {}

  return Promise.resolve(
    retry(
      (tryAgain, attempt) => {
        let stderr = ''
        const port = (opts.port || PORT) + attempt

        return new Promise((resolve, reject) => {
          const srv = cp.spawn(
            'git',
            [
              'daemon',
              '--verbose',
              '--listen=localhost',
              `--port=${port}`,
              '--reuseaddr',
              '--export-all',
              '--base-path=.'
            ],
            {
              cwd: opts.cwd || process.cwd()
            }
          )
          srv.stderr.on('data', (d) => {
            const str = d.toString('utf8')
            stderr += str
            const match = str.match(/\[(\d+)\] Ready to rumble/i)
            if (match) {
              srv.pid = parseInt(match[1])
              srv.port = port
              resolve(srv)
            }
          })
          // TODO: here
          srv.once('exit', reject)
          srv.once('error', reject)
        }).then(
          (srv) => {
            return srv
          },
          (e) => {
            if (stderr.match(/already in use/i)) {
              return tryAgain(e)
            } else {
              throw e
            }
          }
        )
      },
      { factor: 1, minTimeout: 100 }
    )
  )
}

module.exports.mockRepoDisposer = mockRepoDisposer
function mockRepoDisposer (srv) {
  return new Promise((resolve, reject) => {
    srv.on('error', reject)
    srv.on('close', resolve)
    srv.kill()
  })
}
