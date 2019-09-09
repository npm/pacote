const spawn = require('../../../lib/util/git/spawn.js')
const procLog = require('../../../lib/util/proc-log.js')

const t = require('tap')
t.rejects(spawn(['status'], {}, { git: false }), {
  message: 'No git binary found in $PATH',
  code: 'ENOGIT',
})

const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const { basename, resolve } = require('path')
const repo = resolve(__dirname, basename(__filename, '.js'))
mkdirp.sync(repo)
t.teardown(() => rimraf.sync(repo))

const fs = require('fs')
// init a repo.  this also tests the happy path
t.test('setup repo', t => t.resolveMatch(spawn(['init'], { cwd: repo }),
  `Initialized empty Git repository in ${repo}`))

t.test('retries', t => {
  const logs = []
  process.on('log', (...log) => logs.push(log))
  const te = resolve(repo, 'transient-error.js')
  fs.writeFileSync(te, `
console.error('Connection timed out')
process.exit(1)
  `)
  const retryOptions = {
    'one retry object': {
      retry: {
        retries: 2,
        factor: 1,
        maxTimeout: 1000,
        minTimeout: 1,
      },
    },
    'namespaced fetch-retry-* configs': {
      'fetch-retries': 2,
      'fetch-retry-factor': 1,
      'fetch-retry-maxtimeout': 1000,
      'fetch-retry-mintimeout': 1,
    }
  }
  const er = {
    message: `failed '${process.execPath} ${te}`,
    cmd: process.execPath,
    args: [ te ],
    code: 1,
    signal: null,
    stdout: '',
    stderr: 'Connection timed out\n',
  }
  Object.keys(retryOptions).forEach(n => t.test(n, t =>
    t.rejects(spawn([te], { cwd: repo }, {
      git: process.execPath,
      log: procLog,
      ...(retryOptions[n]),
    }), er).then(() => {
      t.same(logs, [
        [
          'silly',
          'pacote',
          `Retrying git command: ${te} attempt # 2`
        ],
        [
          'silly',
          'pacote',
          `Retrying git command: ${te} attempt # 3`
        ]
      ], 'got expected logs')
      logs.length = 0
    })))
  t.end()
})
