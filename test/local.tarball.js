'use strict'

const BB = require('bluebird')

const finished = BB.promisify(require('mississippi').finished)
const fs = BB.promisifyAll(require('fs'))
const mockTar = require('./util/mock-tarball')
const npa = require('npm-package-arg')
const npmlog = require('npmlog')
const path = require('path')
const test = require('tap').test

const CACHE = require('./util/test-dir')(__filename)

const tarball = require('../lib/handlers/local/tarball')

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
      let data = ''
      return finished(
        tarball(npa(tarballPath), OPTS).on('data', d => { data += d })
      ).then(() => {
        t.equal(data, tarData, 'fetched tarball data matches one from local')
      })
    })
  })
})
