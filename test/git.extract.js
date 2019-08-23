'use strict'

const util = require('util')
const fs = require('fs')
const mkdirp = util.promisify(require('mkdirp'))
const npmlog = require('npmlog')
const path = require('path')
const { test } = require('tap')

const testDir = require('./util/test-dir')(__filename)

const extract = require('../extract.js')

const writeFile = util.promisify(fs.writeFile)

npmlog.level = process.env.LOGLEVEL || 'silent'
const OPTS = {
  git: 'git',
  cache: path.join(testDir, 'cache'),
  log: npmlog,
  registry: 'https://my.mock.registry/',
  retry: false
}

test('extracting a git target reports failures', t => {
  const oldPath = process.env.PATH
  process.env.PATH = ''
  const dest = path.join(testDir, 'foo')
  return mkdirp(dest)
    .then(() => writeFile(path.join(dest, 'q'), 'foo'))
    .then(() => extract('github:zkat/pacote', dest,
      Object.assign({}, OPTS)))

    // .finally(() => {
    //
    // })
    .then(() => {
      t.fail('the promise should not have resolved')
    }, (err) => {
      // We're not testing the specific text of the error message. We just check
      // that it is an execution error.
      t.equal(err.code, 'ENOENT')
    })
    .then(() => {
      process.env.PATH = oldPath
    })
    .catch(() => {
      process.env.PATH = oldPath
    })
})
