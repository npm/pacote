const FileFetcher = require('../lib/file.js')
const t = require('tap')
const { relative, resolve, basename } = require('path')
const npa = require('npm-package-arg')
const { promisify } = require('util')
const rimraf = promisify(require('rimraf'))
const mkdirp = require('mkdirp')
const me = resolve(__dirname, basename(__filename, '.js'))
rimraf.sync(me)
mkdirp.sync(me)
t.cleanSnapshot = str => str.split(process.cwd()).join('${CWD}')
t.teardown(() => rimraf.sync(me))

const abbrev = resolve(__dirname, 'fixtures/abbrev-1.1.1.tgz')
const abbrevspec = `file:${relative(process.cwd(), abbrev)}`

t.test('basic', async t => {
  const f = new FileFetcher(abbrevspec, {})
  t.same(f.types, ['file'])
  const fm = await f.manifest()
  t.matchSnapshot(fm, 'manifest')
  t.equal(fm, f.package)
  t.equal(await f.manifest(), fm, 'cached manifest')
  t.matchSnapshot(await f.packument(), 'packument')
  const pj = me + '/extract/package.json'
  return t.resolveMatchSnapshot(f.extract(me + '/extract'), 'extract')
    .then(() => t.matchSnapshot(require(pj), 'package.json extracted'))
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
  const res = await f.extract(target)
  t.throws(() => fs.statSync(target + '/script.js'), 'should be missing')
})
