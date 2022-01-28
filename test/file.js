const FileFetcher = require('../lib/file.js')
const t = require('tap')
const { relative, resolve, basename } = require('path')
const fs = require('fs')
const me = t.testdir({ cache: {} })
const cache = resolve(me, 'cache')
t.cleanSnapshot = str => str.split(process.cwd()).join('${CWD}')

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
  const fs = require('fs')
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
  const fs = require('fs')
  const files = [binString, binObject, binGood]
  t.plan(files.length)
  files.forEach(file => t.test(basename(file, '.tgz'), async t => {
    const spec = `file:${relative(process.cwd(), file)}`
    const f = new FileFetcher(spec, {})
    const target = resolve(me, basename(file, '.tgz'))
    const res = await f.extract(target)
    t.matchSnapshot(res, 'results of unpack')
    t.equal(fs.statSync(target + '/script.js').mode & 0o111, 0o111)
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
  const fs = require('fs')
  // just verify that the file is there.
  t.same(fs.readdirSync(resolve(cache, 'content-v2/sha512/9e/77')), [
    // eslint-disable-next-line max-len
    'bdfc8890fe1cc8858ea97439db06dcfb0e33d32ab634d0fff3bcf4a6e69385925eb1b86ac69d79ff56d4cd35f36d01f67dff546d7a192ccd4f6a7138a2d1',
  ], 'write cache content file')
})
