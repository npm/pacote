'use strict'

const BB = require('bluebird')

const git = require('../lib/util/git')
const test = require('tap').test
const which = BB.promisify(require('which'))

const systemGit = which.sync('git')

test('executes git binary', {
  skip: !systemGit && 'requires git'
}, t => {
  return git._exec(['--version']).spread(stdout => {
    t.match(stdout, /^git version/, 'successfully ran git')
  })
})

const systemNode = which.sync('node')

test('acknowledges git option', t => {
  return git._exec(['--version'], null, {
    git: systemNode
  }).spread(stdout => {
    t.equals(stdout.trim(), process.version)
  })
})
