const t = require('tap')
const { relative, resolve, basename } = require('node:path')
const fs = require('node:fs')
const FileFetcher = require('../lib/file.js')
const tar = require('tar')
const cleanSnapshot = require('./helpers/clean-snapshot.js')
const scriptMode = require('./helpers/script-mode.js')

t.cleanSnapshot = str => cleanSnapshot(str)

const me = t.testdir({ cache: {} })
const cache = resolve(me, 'cache')
const abbrev = resolve(__dirname, 'fixtures/abbrev-1.1.1.tgz')
const abbrevspec = `file:${relative(process.cwd(), abbrev)}`

t.test('basic', async t => {
  const f = new FileFetcher(abbrevspec, { cache })
  t.same(f.types, ['file'])
  const fm = await f.manifest()
  t.matchSnapshot(fm, 'manifest')
  t.equal(fm, f.package)
  t.equal(await f.manifest(), fm, 'cached manifest')
  t.matchSnapshot(await f.packument(), 'packument')
  const pj = me + '/extract/package.json'
  t.matchSnapshot(await f.extract(me + '/extract'), 'extract')
  t.matchSnapshot(require(pj), 'package.json extracted')
  // just verify that the file is there.
  t.same(fs.readdirSync(resolve(cache, 'content-v2/sha512/9e/77')), [
    // eslint-disable-next-line max-len
    'bdfc8890fe1cc8858ea97439db06dcfb0e33d32ab634d0fff3bcf4a6e69385925eb1b86ac69d79ff56d4cd35f36d01f67dff546d7a192ccd4f6a7138a2d1',
  ], 'write cache content file')
})

const binString = resolve(__dirname, 'fixtures/bin-string.tgz')
const binObject = resolve(__dirname, 'fixtures/bin-object.tgz')
// this one actually doesn't need any help
const binGood = resolve(__dirname, 'fixtures/bin-good.tgz')

t.test('make bins executable', t => {
  const files = [binString, binObject, binGood]
  t.plan(files.length)
  files.forEach(file => t.test(basename(file, '.tgz'), async t => {
    const spec = `file:${relative(process.cwd(), file)}`
    const f = new FileFetcher(spec, {})
    const target = resolve(me, basename(file, '.tgz'))
    const res = await f.extract(target)
    t.matchSnapshot(res, 'results of unpack')
    t.equal(fs.statSync(target + '/script.js').mode & scriptMode(), scriptMode())
  }))
})

t.test('dont bork on missing script', async t => {
  const file = resolve(__dirname, 'fixtures/bin-missing.tgz')
  const spec = `file:${relative(process.cwd(), file)}`
  const f = new FileFetcher(spec, {})
  const target = resolve(me, basename(file, '.tgz'))
  await f.extract(target)
  t.throws(() => fs.statSync(target + '/script.js'), 'should be missing')
})

t.test('with readme', async t => {
  const f = new FileFetcher(abbrevspec, { cache, fullReadJson: true })
  t.same(f.types, ['file'])
  const fm = await f.manifest()
  delete fm.gitHead
  t.matchSnapshot(fm, 'manifest-slow-json')
  t.equal(fm, f.package)
  t.equal(await f.manifest(), fm, 'cached manifest')
  t.matchSnapshot(await f.packument(), 'packument-slow-json')
  const pj = me + '/extract/package.json'
  t.matchSnapshot(await f.extract(me + '/extract'), 'extract-slow-json')
  t.matchSnapshot(require(pj), 'package.json extracted slow json')
  // just verify that the file is there.
  t.same(fs.readdirSync(resolve(cache, 'content-v2/sha512/9e/77')), [
    // eslint-disable-next-line max-len
    'bdfc8890fe1cc8858ea97439db06dcfb0e33d32ab634d0fff3bcf4a6e69385925eb1b86ac69d79ff56d4cd35f36d01f67dff546d7a192ccd4f6a7138a2d1',
  ], 'write cache content file')
})

t.test('read a manifest without extracting the archive', async t => {
  for (const file of [abbrev, binString, binObject]) {
    const f = new FileFetcher(file, { cache })
    f.extract = () => {
      throw new Error('manifest lookup must not extract the archive')
    }
    const manifest = await f.manifest()
    t.ok(manifest.name, 'read package name')
    t.ok(manifest._integrity, 'verify and cache the entire tarball')
    t.equal(await f.manifest(), manifest, 'reuse the parsed manifest')
  }
})

t.test('keep directories.bin normalization', async t => {
  const dir = t.testdir({
    package: {
      'package.json': JSON.stringify({
        name: 'bin-directory',
        version: '1.0.0',
        directories: { bin: 'bin' },
      }),
      bin: { tool: 'hello' },
    },
  })
  const file = resolve(dir, 'package.tgz')
  await tar.c({ cwd: dir, file, gzip: true }, ['package'])
  const f = new FileFetcher(file, { cache })
  t.same((await f.manifest()).bin, { tool: 'bin/tool' })
})

t.test('read a manifest spanning chunks without corrupting UTF-8', async t => {
  const data = {
    name: 'chunked',
    version: '1.0.0',
    description: 'hello 🌍'.repeat(20000),
    bin: './tool.js',
    optionalDependencies: { optional: '1.0.0' },
    dependencies: { optional: '1.0.0', required: '2.0.0' },
  }
  const dir = t.testdir({
    package: { 'package.json': JSON.stringify(data), 'tool.js': 'hello' },
  })
  const file = resolve(dir, 'package.tgz')
  await tar.c({ cwd: dir, file, gzip: true }, ['package'])
  const f = new FileFetcher(file, { cache })
  const manifest = await f.manifest()
  t.equal(manifest.description, data.description)
  t.same(manifest.bin, { chunked: 'tool.js' })
  t.same(manifest.dependencies, { required: '2.0.0' })
  const cached = new FileFetcher(file, { cache, integrity: f.integrity })
  t.same(await cached.manifest(), manifest, 'read the same manifest from cache')
})

t.test('do not use a nested package.json as the manifest', async t => {
  const dir = t.testdir({
    package: { nested: { 'package.json': '{"name":"nested","version":"1.0.0"}' } },
  })
  const file = resolve(dir, 'package.tgz')
  await tar.c({ cwd: dir, file, gzip: true }, ['package'])
  await t.rejects(new FileFetcher(file, { cache }).manifest(), { code: 'ENOENT' })
})

t.test('manifest read errors', async t => {
  const dir = t.testdir({ 'invalid.tgz': 'this is not an archive' })
  await t.rejects(new FileFetcher(resolve(dir, 'missing.tgz'), { cache }).manifest(),
    { code: 'ENOENT' })
  await t.rejects(new FileFetcher(resolve(dir, 'invalid.tgz'), { cache }).manifest(),
    { code: 'TAR_BAD_ARCHIVE' })
  const f = new FileFetcher(abbrev, {
    cache,
    integrity: 'sha512-' + Buffer.alloc(64).toString('base64'),
  })
  await t.rejects(f.manifest(), { code: 'EINTEGRITY' })
})

t.test('preserve extraction of unusual manifest paths', async t => {
  for (const path of [
    'package/./package.json',
    'package//package.json',
    'package/C:/package.json',
    '/package/package.json',
    'package\\\\package.json',
  ]) {
    const dir = t.testdir()
    const chunks = []
    for (const [name, version] of [['package/package.json', '1.0.0'], [path, '2.0.0']]) {
      const data = Buffer.from(JSON.stringify({ name: 'paths', version }))
      const header = new tar.Header({ path: name, type: 'File', size: data.length, mode: 0o644 })
      header.encode()
      chunks.push(header.block, data, Buffer.alloc((512 - data.length % 512) % 512))
    }
    chunks.push(Buffer.alloc(1024))
    const file = resolve(dir, 'package.tar')
    fs.writeFileSync(file, Buffer.concat(chunks))
    const f = new FileFetcher(file, { cache })
    const extracted = resolve(dir, 'extracted')
    await f.extract(extracted)
    t.equal((await f.manifest()).version, JSON.parse(fs.readFileSync(extracted + '/package.json', 'utf8')).version, path)
  }
})
