'use strict'

const util = require('util')

const fs = require('fs')
const getBuff = require('get-stream').buffer
const mockTar = require('./util/mock-tarball')
const npa = require('npm-package-arg')
const npmlog = require('npmlog')
const path = require('path')
const { test } = require('tap')

const CACHE = require('./util/test-dir')(__filename)

const fetch = require('../lib/fetch')

const writeFile = util.promisify(fs.writeFile)

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
    return writeFile(tarballPath, tarData).then(() => {
      return getBuff(fetch.tarball(npa(tarballPath), OPTS))
    }).then(data => {
      t.deepEqual(data, tarData, 'fetched tarball data matches one from local')
    })
  })
})
