'use strict'

var fs = require('fs')
var mockTar = require('./util/mock-tarball')
var npmlog = require('npmlog')
var pipe = require('mississippi').pipe
var test = require('tap').test

require('./util/test-dir')(__filename)

var extractStream = require('../lib/extract-stream')

npmlog.level = process.env.LOGLEVEL || 'silent'
var OPTS = {
  log: npmlog
}

test('basic extraction', function (t) {
  var pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.0.0'
    }),
    'index.js': 'console.log("hello world!")'
  }
  t.plan(2)
  mockTar(pkg, {stream: true}, function (err, tarStream) {
    if (err) { throw err }
    pipe(tarStream, extractStream('./'), function (err) {
      if (err) { throw err }
      fs.readFile('./package.json', 'utf8', function (err, data) {
        if (err) { throw err }
        t.deepEqual(data, pkg['package.json'], 'extracted package.json')
      })
      fs.readFile('./index.js', 'utf8', function (err, data) {
        if (err) { throw err }
        t.equal(data, pkg['index.js'], 'extracted index.js')
      })
    })
  })
})

test('automatically handles gzipped tarballs', function (t) {
  var pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.0.0'
    }),
    'index.js': 'console.log("hello world!")'
  }
  t.plan(2)
  mockTar(pkg, {gzip: true, stream: true}, function (err, tarStream) {
    if (err) { throw err }
    pipe(tarStream, extractStream('./', OPTS), function (err) {
      if (err) { throw err }
      fs.readFile('./package.json', 'utf8', function (err, data) {
        if (err) { throw err }
        t.deepEqual(data, pkg['package.json'], 'got gunzipped package.json')
      })
      fs.readFile('./index.js', 'utf8', function (err, data) {
        if (err) { throw err }
        t.equal(data, pkg['index.js'], 'got gunzipped index.js')
      })
    })
  })
})

test('strips first item in path, even if not `package/`', function (t) {
  var pkg = {
    'package/package.json': JSON.stringify({
      name: 'foo',
      version: '1.0.0'
    }),
    'something-else/index.js': 'console.log("hello world!")'
  }
  t.plan(2)
  mockTar(pkg, {noPrefix: true, stream: true}, function (err, tarStream) {
    if (err) { throw err }
    pipe(tarStream, extractStream('./', OPTS), function (err) {
      if (err) { throw err }
      fs.readFile('./package.json', 'utf8', function (err, data) {
        if (err) { throw err }
        t.deepEqual(
          data, pkg['package/package.json'], 'flattened package.json')
      })
      fs.readFile('./index.js', 'utf8', function (err, data) {
        if (err) { throw err }
        t.equal(
          data, pkg['something-else/index.js'], 'flattened index.js')
      })
    })
  })
})

test('excludes symlinks', function (t) {
  var pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.0.0'
    }),
    'index.js': 'console.log("hello world!")',
    'linky': { type: 'link', linkname: '/usr/local/bin/linky' },
    'symmylinky': { type: 'symlink', linkname: '../nowhere' }
  }
  t.plan(3)
  mockTar(pkg, {stream: true}, function (err, tarStream) {
    if (err) { throw err }
    pipe(tarStream, extractStream('./', OPTS), function (err) {
      if (err) { throw err }
      fs.readFile('./package.json', 'utf8', function (err, data) {
        if (err) { throw err }
        t.deepEqual(data, pkg['package.json'], 'package.json still there')
      })
      fs.stat('./linky', function (err) {
        t.equal(err.code, 'ENOENT', 'hard link excluded!')
      })
      fs.readFile('./symmylinky', function (err) {
        t.equal(err.code, 'ENOENT', 'symlink excluded!')
      })
    })
  })
})

// Yes, this logic is terrible and seriously confusing, but
// I'm pretty sure this is exactly what npm is doing.
// ...we should really deprecate this cluster.
test('renames .gitignore to .npmignore if not present', function (t) {
  t.plan(6)
  mockTar({
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.0.0'
    }),
    'index.js': 'console.log("hello world!")',
    '.gitignore': 'tada!'
  }, {stream: true}, function (err, tarStream) {
    if (err) { throw err }
    pipe(tarStream, extractStream('./no-npmignore', OPTS), function (err) {
      if (err) { throw err }
      fs.readFile('./no-npmignore/.npmignore', 'utf8', function (err, data) {
        if (err) { throw err }
        t.deepEqual(data, 'tada!', '.gitignore renamed to .npmignore')
      })
    })
  })
  mockTar({
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.0.0'
    }),
    'index.js': 'console.log("hello world!")',
    '.gitignore': 'git!',
    '.npmignore': 'npm!'
  }, {stream: true}, function (err, tarStream) {
    if (err) { throw err }
    pipe(tarStream, extractStream('./has-npmignore1', OPTS), function (err) {
      if (err) { throw err }
      fs.readFile('./has-npmignore1/.npmignore', 'utf8', function (err, data) {
        if (err) { throw err }
        t.deepEqual(data, 'npm!', '.npmignore left intact if present')
      })
      fs.readFile('./has-npmignore1/.gitignore', 'utf8', function (err, data) {
        t.ok(err, 'got expected error on reading .gitignore')
        t.equal(err.code, 'ENOENT', '.gitignore missing')
      })
    })
  })
  mockTar({
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.0.0'
    }),
    'index.js': 'console.log("hello world!")',
    '.npmignore': 'npm!',
    '.gitignore': 'git!'
  }, {stream: true}, function (err, tarStream) {
    if (err) { throw err }
    pipe(tarStream, extractStream('./has-npmignore2', OPTS), function (err) {
      if (err) { throw err }
      fs.readFile('./has-npmignore2/.npmignore', 'utf8', function (err, data) {
        if (err) { throw err }
        t.deepEqual(data, 'npm!', '.npmignore left intact if present')
      })
      fs.readFile('./has-npmignore2/.gitignore', 'utf8', function (err, data) {
        if (err) { throw err }
        t.deepEqual(data, 'git!', '.gitignore intact if we previously had an .npmignore')
      })
    })
  })
})

test('accepts dmode/fmode/umask opts', {
  skip: process.platform === 'win32'
}, function (t) {
  var pkg = {
    'package.json': {
      data: JSON.stringify({
        name: 'foo',
        version: '1.0.0'
      }),
      fmode: parseInt('777', 8),
      dmode: parseInt('777', 8),
      umask: parseInt('777', 8)
    },
    'foo/index.js': 'console.log("hello world!")'
  }
  t.plan(2)
  mockTar(pkg, {stream: true}, function (err, tarStream) {
    if (err) { throw err }
    pipe(tarStream, extractStream('./', {
      dmode: parseInt('555', 8),
      fmode: parseInt('644', 8),
      umask: parseInt('266', 8)
    }), function (err) {
      if (err) { throw err }
      fs.stat('./package.json', function (err, stat) {
        if (err) { throw err }
        t.equal(
          stat.mode & parseInt('000777', 8),
          parseInt('400', 8),
          'fmode set as expected'
        )
      })
      // TODO - I don't understand why this one is always 755
      // :(
      // fs.stat('./foo', function (err, stat) {
      //   if (err) { throw err }
      //   t.equal(
      //     stat.mode & parseInt('000777', 8),
      //     parseInt('411', 8),
      //     'dmode set as expected'
      //   )
      // })
      fs.stat('./foo/index.js', function (err, stat) {
        if (err) { throw err }
        t.equal(
          stat.mode & parseInt('000777', 8),
          parseInt('400', 8),
          'fmode set as expected'
        )
      })
    })
  })
})
