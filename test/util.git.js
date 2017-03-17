'use strict'

const BB = require('bluebird')

const git = require('../lib/util/git')
const gitUtil = require('./util/git')
const Tacks = require('tacks')
const test = require('tap').test
const which = BB.promisify(require('which'))

const CACHE = require('./util/test-dir')(__filename)

const systemGit = which.sync('git')

test('executes git binary', {
  skip: !systemGit && 'requires git'
}, t => {
  return git._exec(['--version']).spread(stdout => {
    t.match(stdout, /^git version/, 'successfully ran git')
  })
})
