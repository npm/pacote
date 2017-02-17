'use strict'

var fs = require('fs')
var npmlog = require('npmlog')
var pipe = require('mississippi').pipe
var test = require('tap').test

require('./util/test-dir')(__filename)

var extractStream = require('../lib/extract-stream')

npmlog.level = process.env.LOGLEVEL || 'silent'
var OPTS = {
  log: npmlog
}

test('basic extraction')
test('excludes symlinks')
test('renames .gitignore to .npmignore if not present')
test('accepts gid and uid opts')
test('accepts dmode/fmode/umask opts')
test('automatically handles gzipped tarballs')
test('strips first item in path, even if not `package/`')
