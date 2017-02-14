'use strict'

var fs = require('fs')
var npmlog = require('npmlog')
var pipe = require('mississippi').pipe
var test = require('tap').test

require('./util/test-dir')(__filename)

var extractShrinkwrap = require('../lib/util/extract-shrinkwrap')

var SHRINKWRAP = {
  'name': 'test',
  'version': '1.0.0',
  'dependencies': {
    'eggplant': {
      'version': '1.0.2',
      'from': 'eggplant@latest',
      'resolved': 'https://registry.npmjs.org/eggplant/-/eggplant-1.0.2.tgz'
    }
  }
}

var HAS_SHRINKWRAP = '../../fixtures/has-shrinkwrap.tgz'
var NO_SHRINKWRAP = '../../fixtures/no-shrinkwrap.tgz'
var DEST = './copy.tgz'

test('basic shrinkwrap extraction', function (t) {
  var input = fs.createReadStream(HAS_SHRINKWRAP)
  var output = fs.createWriteStream(DEST)

  t.plan(3)
  extractShrinkwrap(input, {log: npmlog}, function (err, sr) {
    if (err) { throw err }
    t.ok(sr, 'got a shrinkwrap back!')
    t.deepEqual(sr, SHRINKWRAP, 'shrinkwrap data correct')
  })
  pipe(input, output, function (err) {
    if (err) { throw err }
    fs.readFile(HAS_SHRINKWRAP, 'utf8', function (err, src) {
      if (err) { throw err }
      fs.readFile(DEST, 'utf8', function (err, dest) {
        if (err) { throw err }
        t.equal(src, dest, 'data fully copied')
      })
    })
  })
})

test('no shrinkwrap in tarball', function (t) {
  var input = fs.createReadStream(NO_SHRINKWRAP)
  var output = fs.createWriteStream(DEST)

  t.plan(2)
  extractShrinkwrap(input, {log: npmlog}, function (err, sr) {
    if (err) { throw err }
    t.notOk(sr, 'no shrinkwrap returned')
  })
  pipe(input, output, function (err) {
    if (err) { throw err }
    fs.readFile(NO_SHRINKWRAP, 'utf8', function (err, src) {
      if (err) { throw err }
      fs.readFile(DEST, 'utf8', function (err, dest) {
        if (err) { throw err }
        t.equal(src, dest, 'data fully copied')
      })
    })
  })
})

test('stops parsing tarball after shrinkwrap found')
test('source stream continues after shrinkwrap found')
test('source stream errors trigger extract error')
test('only calls cb once if stream error after shrinkwrap found')
test('works fine when teeing a `request` stream')
