'use strict'

const BB = require('bluebird')

const fs = BB.promisifyAll(require('fs'))
const getBuff = require('get-stream').buffer
const mockTar = require('./util/mock-tarball')
const npa = require('npm-package-arg')
const npmlog = require('npmlog')
const path = require('path')
const test = require('tap').test

const CACHE = require('./util/test-dir')(__filename)

const fetch = require('../lib/fetch')

npmlog.level = process.env.LOGLEVEL || 'silent'
const OPTS = {
  log: npmlog
}

test('basic tarball streaming', function (t) {
  const pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.2.3'
    }),
    'index.js': 'console.log("hello world!")'
  }
  const tarballPath = path.join(CACHE, 'foo-1.2.3.tgz')
  return mockTar(pkg).then(tarData => {
    return fs.writeFileAsync(tarballPath, tarData).then(() => {
      return getBuff(fetch.tarball(npa(tarballPath), OPTS))
    }).then(data => {
      t.deepEqual(data, tarData, 'fetched tarball data matches one from local')
    })
  })
})
