const t = require('tap')
const Arborist = require('@npmcli/arborist')
const fs = require('node:fs')
const { resolve } = require('node:path')
const DirFetcher = require('../lib/dir.js')

const loadActual = (path) => new Arborist({ path }).loadActual()
const me = t.testdir()

t.test('strips patchedDependencies from the packed package.json, preserving formatting', async t => {
  const original = JSON.stringify({
    name: 'patched-pkg',
    version: '1.0.0',
    main: 'index.js',
    patchedDependencies: { 'abbrev@2.0.0': 'patches/abbrev@2.0.0.patch' },
    license: 'MIT',
  }, null, 2) + '\n'
  const dir = t.testdir({
    'package.json': original,
    'index.js': 'module.exports = 1\n',
    patches: { 'abbrev@2.0.0.patch': 'the patch\n' },
  })
  const f = new DirFetcher(`file:${dir}`, { tree: await loadActual(dir) })
  const out = resolve(me, 'patched')
  await f.extract(out)

  const packed = fs.readFileSync(resolve(out, 'package.json'), 'utf8')
  t.notMatch(packed, /patchedDependencies/, 'patchedDependencies stripped from the tarball')
  const expected = JSON.stringify({
    name: 'patched-pkg', version: '1.0.0', main: 'index.js', license: 'MIT',
  }, null, 2) + '\n'
  t.equal(packed, expected, 'other fields and the 2-space formatting are preserved')
  // the source package.json on disk is never mutated
  t.equal(fs.readFileSync(resolve(dir, 'package.json'), 'utf8'), original, 'source package.json untouched')
})

t.test('leaves a package without patchedDependencies byte-identical', async t => {
  const original = '{\n  "name": "plain",\n  "version": "1.0.0",\n  "main": "index.js"\n}\n'
  const dir = t.testdir({ 'package.json': original, 'index.js': 'x\n' })
  const f = new DirFetcher(`file:${dir}`, { tree: await loadActual(dir) })
  const out = resolve(me, 'plain')
  await f.extract(out)
  t.equal(fs.readFileSync(resolve(out, 'package.json'), 'utf8'), original, 'unchanged when no patches are declared')
})

t.test('falls back to default formatting for a minified package.json', async t => {
  const dir = t.testdir({
    'package.json':
      '{"name":"min","version":"1.0.0","patchedDependencies":{"abbrev@2.0.0":"patches/a.patch"}}',
    'index.js': 'x\n',
    patches: { 'a.patch': 'p\n' },
  })
  const f = new DirFetcher(`file:${dir}`, { tree: await loadActual(dir) })
  const out = resolve(me, 'min')
  await f.extract(out)
  const packed = fs.readFileSync(resolve(out, 'package.json'), 'utf8')
  t.notMatch(packed, /patchedDependencies/, 'patchedDependencies stripped from a minified manifest')
  t.match(packed, /"name":\s*"min"/, 'the rest of the manifest still ships')
})
