'use strict'

const t = require('tap')
const { join } = require('node:path')
const Arborist = require('@npmcli/arborist')

// Verify that DirFetcher pulls `globalIgnoreFile` out of opts and passes it on
// to npm-packlist. Use a mocked packlist so the assertion holds regardless of
// whether the installed npm-packlist understands the option yet.
t.test('DirFetcher forwards globalIgnoreFile to npm-packlist', async t => {
  const dir = t.testdir({
    pkg: {
      'package.json': JSON.stringify({ name: 'pacote-fwd', version: '1.0.0' }, null, 2),
      'index.js': '"use strict"\n',
    },
  })
  const pkgDir = join(dir, 'pkg')

  let receivedOpts = null
  const pacote = t.mock('../lib/index.js', {
    'npm-packlist': (tree, opts) => {
      receivedOpts = opts
      // return a minimal file list so tar.c can build a tarball
      return Promise.resolve(['package.json', 'index.js'])
    },
  })

  await pacote.tarball(`file:${pkgDir}`, {
    Arborist,
    globalIgnoreFile: '/some/path/to/.npmignore',
  })

  t.ok(receivedOpts, 'packlist was called')
  t.equal(
    receivedOpts.globalIgnoreFile,
    '/some/path/to/.npmignore',
    'globalIgnoreFile reached packlist'
  )
})

t.test('DirFetcher does not pass globalIgnoreFile when caller omits it', async t => {
  const dir = t.testdir({
    pkg: {
      'package.json': JSON.stringify({ name: 'pacote-no-fwd', version: '1.0.0' }, null, 2),
      'index.js': '"use strict"\n',
    },
  })
  const pkgDir = join(dir, 'pkg')

  let receivedOpts = null
  const pacote = t.mock('../lib/index.js', {
    'npm-packlist': (tree, opts) => {
      receivedOpts = opts
      return Promise.resolve(['package.json', 'index.js'])
    },
  })

  await pacote.tarball(`file:${pkgDir}`, { Arborist })

  t.ok(receivedOpts, 'packlist was called')
  t.equal(receivedOpts.globalIgnoreFile, undefined, 'undefined passed through')
})
