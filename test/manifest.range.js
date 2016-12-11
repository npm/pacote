var npmlog = require('npmlog')
var test = require('tap').test
var tnock = require('./util/tnock')

var manifest = require('../manifest')

var META = {
  name: 'foo',
  'dist-tags': { lts: '1.2.3', latest: '3.2.1' },
  versions: {
    '0.0.0': {
      name: 'foo',
      version: '0.0.0'
    },
    '1.2.0': {
      name: 'foo',
      version: '1.2.0',
      engines: {
        node: '^1.0.0',
        npm: '^2.0.1'
      }
    },
    '2.0.4': {
      name: 'foo',
      version: '2.0.4'
    },
    '1.2.1': {
      name: 'foo',
      version: '1.2.1'
    },
    '1.2.4': {
      name: 'foo',
      version: '1.2.4'
    },
    '3.4.5': {
      name: 'foo',
      version: '3.4.5'
    }
  }
}

npmlog.level = process.env.LOGLEVEL || 'silent'
var OPTS = {
  registry: 'https://mock.reg',
  log: npmlog,
  retry: {
    retries: 1,
    factor: 1,
    minTimeout: 1,
    maxTimeout: 10
  }
}

test('fetches manifest from registry by range', function (t) {
  var srv = tnock(t, OPTS.registry)

  srv.get('/foo').reply(200, META)
  manifest('foo@^1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, META.versions['1.2.4'], 'picked right manifest')
    t.end()
  })
})

test('fetches manifest from scoped registry by range', function (t) {
  var srv = tnock(t, OPTS.registry)

  srv.get('/@usr%2ffoo').reply(200, META)
  manifest('@usr/foo@^1.2.4', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, META.versions['1.2.4'], 'got scoped manifest from version')
    t.end()
  })
})
