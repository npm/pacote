'use strict'

const BB = require('bluebird')

const fs = require('fs')
const mockTar = require('./util/mock-tarball')
const npmlog = require('npmlog')
const path = require('path')
const pipe = BB.promisify(require('mississippi').pipe)
const requireInject = require('require-inject')
const test = require('tap').test

require('./util/test-dir')(__filename)

npmlog.level = process.env.LOGLEVEL || 'silent'

test('accepts gid and uid opts', {skip: !process.getuid}, t => {
  const pkg = {
    'target/package.json': {
      data: JSON.stringify({
        name: 'foo',
        version: '1.0.0'
      })
    },
    'target/foo/index.js': 'console.log("hello world!")'
  }
  const NEWUID = process.getuid() + 1
  const NEWGID = process.getgid() + 1
  // All of this only happens on uid === 0
  process.getuid = () => 0
  const updatedPaths = []
  const fsClone = Object.create(fs)
  fsClone.utimes = (_1, _2, _3, cb) => cb()
  fsClone.chown = (p, uid, gid, cb) => {
    process.nextTick(() => {
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
  const extractStream = requireInject('../lib/extract-stream', {
    fs: fsClone
  })
  return mockTar(pkg, {stream: true}).then(tarStream => {
    return pipe(tarStream, extractStream('.', {
      uid: NEWUID,
      gid: NEWGID,
      log: npmlog
    }))
  }).then(() => {
    t.deepEqual(updatedPaths, [
      'target/package.json',
      'target/foo/index.js'
    ], 'extracted files had correct uid/gid set')
  })
})
