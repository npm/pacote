'use strict'

const getBuff = require('get-stream').buffer
const mockTar = require('./util/mock-tarball')
const npa = require('npm-package-arg')
const npmlog = require('npmlog')
const test = require('tap').test
const tnock = require('./util/tnock')

require('./util/test-dir')(__filename)

const fetch = require('../lib/fetch')

npmlog.level = process.env.LOGLEVEL || 'silent'
const OPTS = {
  log: npmlog,
  registry: 'https://my.mock.registry/',
  retry: {
    retries: 1,
    factor: 1,
    minTimeout: 1,
    maxTimeout: 10
  }
}

test('basic tarball streaming', function (t) {
  const pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.2.3'
    }),
    'index.js': 'console.log("hello world!")'
  }
  return mockTar(pkg).then(tarData => {
    const tarballPath = '/foo/hosted/plexus/foo-1.2.3.tgz'
    const srv = tnock(t, OPTS.registry)
    srv.get(tarballPath).reply(200, tarData)
    const spec = npa(OPTS.registry + tarballPath.slice(1))
    return getBuff(fetch.tarball(spec, OPTS)).then(data => {
      t.deepEqual(data, tarData, 'fetched tarball data matches')
    })
  })
})
