var crypto = require('crypto')
var finished = require('mississippi').finished
var fromString = require('./util/from-string')
var npmlog = require('npmlog')
var path = require('path')
var pipe = require('mississippi').pipe
var rimraf = require('rimraf')
var test = require('tap').test
var testDir = require('./util/test-dir')

var CACHE = testDir(__filename)
var cache = require('../lib/cache')
var cacache = require('cacache')
var CONTENTS = 'foobarbaz'
var DIGEST = crypto.createHash('sha1').update(CONTENTS).digest('hex')
var KEY = 'testkey'
var OPTS = {
  log: npmlog,
  memoize: true,
  metadata: {
    foo: 'bar'
  }
}

test('cache key generation', function (t) {
  var key = cache.key('abc', 'def')
  t.equal(key, 'pacote:abc:def', 'useful unique key gen')
  t.done()
})

test('streaming cache get', function (t) {
  cache._clearMemoized()
  cacache.put(CACHE, KEY, CONTENTS, OPTS, function (err) {
    if (err) { throw err }
    t.comment('mock cache contents inserted')
    var contents = ''
    var meta
    var stream = cache.get.stream(
      CACHE, KEY, OPTS
    ).on('data', function (d) {
      contents += d
    }).on('metadata', function (m) {
      meta = m
    })
    finished(stream, function (err) {
      if (err) { throw err }
      t.equal(contents, CONTENTS, 'stream extracted cache contents correctly')
      t.deepEqual(meta, OPTS.metadata, 'metadata contents correct')
      t.done()
    })
  })
})

test('bulk cache get', function (t) {
  cache._clearMemoized()
  cacache.put(CACHE, KEY, CONTENTS, OPTS, function (err) {
    if (err) { throw err }
    t.comment('mock cache contents inserted')
    cache.get(CACHE, KEY, OPTS, function (err, data, meta) {
      if (err) { throw err }
      t.equal(data, CONTENTS, 'contents returned correctly')
      t.deepEqual(meta, OPTS.metadata, 'returned metadata')
      var loc = path.join(CACHE, 'content', DIGEST)
      rimraf(loc, function (err) {
        if (err) { throw err }
        t.comment('blew away cache from disk')
        cache.get(CACHE, KEY, OPTS, function (err, d2, m2) {
          if (err) { throw err }
          t.deepEqual({
            data: d2,
            meta: m2
          }, {
            data: data,
            meta: meta
          }, 'contents memoized')
          t.done()
        })
      })
    })
  })
})

test('streaming cache put', function (t) {
  cache._clearMemoized()
  var dig
  var src = fromString(CONTENTS)
  var dest = cache.put.stream(
    CACHE, KEY, OPTS
  ).on('digest', function (d) { dig = d })
  pipe(src, dest, function (err) {
    if (err) { throw err }
    t.equal(dig, DIGEST, 'emitted correct digest')
    cacache.get(CACHE, KEY, OPTS, function (err, data, meta) {
      if (err) { throw err }
      var memoized = cache._clearMemoized()[CACHE + ':' + KEY]
      t.equal(data, CONTENTS, 'data in db correct')
      t.deepEqual(meta.metadata, OPTS.metadata, 'got metadata')
      t.deepEqual(memoized, {
        data: CONTENTS,
        meta: OPTS.metadata
      }, 'data memoized')
      t.done()
    })
  })
})

test('bulk cache put', function (t) {
  cache._clearMemoized()
  cache.put(CACHE, KEY, CONTENTS, OPTS, function (err) {
    if (err) { throw err }
    cacache.get(CACHE, KEY, OPTS, function (err, data, meta) {
      if (err) { throw err }
      var memoized = cache._clearMemoized()[CACHE + ':' + KEY]
      t.equal(data, CONTENTS, 'data in db correct')
      t.ok(meta, 'got metadata')
      delete meta.time
      var target = {
        path: path.join(CACHE, 'content', DIGEST),
        key: KEY,
        digest: DIGEST,
        metadata: OPTS.metadata
      }
      t.deepEqual(meta, target, 'cache index entry correct')
      t.deepEqual(memoized, {
        data: data,
        meta: OPTS.metadata
      }, 'contents memoized')
      t.done()
    })
  })
})

test('opts are optional', function (t) {
  cache._clearMemoized()
  cache.put(CACHE, KEY, CONTENTS, function (err) {
    if (err) { throw err }
    t.ok(true, 'put succeeded')
    cache.get(CACHE, KEY, function (err, data, meta) {
      if (err) { throw err }
      t.equal(data, CONTENTS, 'got data!')
      t.notOk(meta, 'metadata empty!')
      t.done()
    })
  })
})
