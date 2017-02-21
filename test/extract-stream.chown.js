'use strict'

var fs = require('fs')
var mockTar = require('./util/mock-tarball')
var npmlog = require('npmlog')
var path = require('path')
var pipe = require('mississippi').pipe
var requireInject = require('require-inject')
var test = require('tap').test

require('./util/test-dir')(__filename)

npmlog.level = process.env.LOGLEVEL || 'silent'

test('accepts gid and uid opts', {
  skip: !process.getuid
}, function (t) {
  var pkg = {
    'package.json': {
      data: JSON.stringify({
        name: 'foo',
        version: '1.0.0'
      })
    },
    'foo/index.js': 'console.log("hello world!")'
  }
  var NEWUID = process.getuid() + 1
  var NEWGID = process.getgid() + 1
  // All of this only happens on uid === 0
  process.getuid = function () { return 0 }
  var updatedPaths = []
  var fsClone = Object.create(fs)
  fsClone.chown = function (p, uid, gid, cb) {
    process.nextTick(function () {
      t.deepEqual({
        uid: uid,
        gid: gid
      }, {
        uid: NEWUID,
        gid: NEWGID
      }, 'correct owner set on ' + p)
      updatedPaths.push(path.relative('.', p))
      cb(null)
    })
  }
  var extractStream = requireInject('../lib/extract-stream', {
    fs: fsClone
  })
  mockTar(pkg, {stream: true}, function (err, tarStream) {
    if (err) { throw err }
    pipe(tarStream, extractStream('./target', {
      uid: NEWUID,
      gid: NEWGID,
      log: npmlog
    }), function (err) {
      if (err) { throw err }
      t.deepEqual(updatedPaths, [
        'target',
        'target/package.json',
        'target/foo',
        'target/foo/index.js'
      ], 'extracted files had correct uid/gid set')
      t.done()
    })
  })
})
