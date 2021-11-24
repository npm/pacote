const runScript = require('@npmcli/run-script')
const RUNS = []
const t = require('tap')

const DirFetcher = t.mock('../lib/dir.js', {
  '@npmcli/run-script': (opts) => {
    RUNS.push(opts)
    // don't actually inherit or print banner in the test, though.
    return runScript({ ...opts, stdio: 'pipe', banner: false })
  },
})

const fs = require('fs')

const { relative, resolve, basename } = require('path')

const me = t.testdir()

const cwd = process.cwd()
// console.log escapes it
const doubleEscapedCwd = cwd.replace(/\\/g, '\\\\')
// console.log of --json escapes it AGAIN
const tripleEscapedCwd = cwd.replace(/\\/g, '\\\\\\\\')
t.cleanSnapshot = str =>
  str.split(version).join('{VERSION}')
t.cleanSnapshot = str => str
    .split(doubleEscapedCwd).join('${CWD}')
    .split(tripleEscapedCwd).join('${CWD}')
    //TODO this isn't ideal it would be nice to make sure paths in windows are right
    .replace(/\\+/g, '/') // remaining backslashes that aren't part of cwd

const abbrev = resolve(__dirname, 'fixtures/abbrev')
const abbrevspec = `file:${relative(process.cwd(), abbrev)}`

t.test('basic', async t => {
  const f = new DirFetcher(abbrevspec, {})
  t.same(f.types, ['directory'])
  t.resolveMatchSnapshot(f.packument(), 'packument')
  t.resolveMatchSnapshot(f.manifest(), 'manifest')
  const pj = me + '/abbrev/package.json'
  const extract = await f.extract(me + '/abbrev')
  extract.integrity = '{sha}'
  t.matchSnapshot(extract, 'extract')
  t.matchSnapshot(require(pj), 'package.json extracted')
  t.matchSnapshot(f.package, 'saved package.json')
  const mani = await f.manifest()
  t.equal(mani, f.package)
})

t.test('dir with integrity', async t => {
  const f = new DirFetcher(abbrevspec, {
    integrity: 'sha512-whatever-this-is-only-checked-if-we-extract-it',
  })
  t.same(f.types, ['directory'])
  t.resolveMatchSnapshot(f.packument(), 'packument')
})

const prepare = resolve(__dirname, 'fixtures/prepare-script')
const preparespec = `file:${relative(process.cwd(), prepare)}`

t.test('with prepare script', async t => {
  RUNS.length = 0
  const f = new DirFetcher(preparespec, {})
  t.resolveMatchSnapshot(f.packument(), 'packument')
  t.resolveMatchSnapshot(f.manifest(), 'manifest')
  const index = me + '/prepare/index.js'
  const extract = await f.extract(me + '/prepare')
  extract.integrity = '{sha}'
  t.matchSnapshot(extract, 'extract')
  await t.spawn(process.execPath, [index], 'test prepared result')
  t.matchSnapshot(fs.readdirSync(me + '/prepare').sort(), 'file list')
  t.match(RUNS[0], {
    stdio: 'pipe',
    banner: false,
  }, 'should run in background')
})

t.test('responds to foregroundScripts: true', async t => {
  RUNS.length = 0
  const opt = { foregroundScripts: true }
  const f = new DirFetcher(preparespec, opt)
  t.resolveMatchSnapshot(f.packument(), 'packument')
  t.resolveMatchSnapshot(f.manifest(), 'manifest')
  const index = me + '/prepare/index.js'
  const extract = await f.extract(me + '/prepare')
  extract.integrity = '{sha}'
  t.matchSnapshot(extract, 'extract')
  await t.spawn(process.execPath, [index], 'test prepared result')
  t.matchSnapshot(fs.readdirSync(me + '/prepare').sort(), 'file list')
  t.match(RUNS[0], {
    stdio: 'inherit',
    banner: true,
  }, 'should run in foreground')
})

t.test('responds to foregroundScripts: true and log:{level: silent}', async t => {
  RUNS.length = 0
  const opt = { foregroundScripts: true, log: { level: 'silent' } }
  const f = new DirFetcher(preparespec, opt)
  t.resolveMatchSnapshot(f.packument(), 'packument')
  t.resolveMatchSnapshot(f.manifest(), 'manifest')
  const index = me + '/prepare/index.js'
  const extract = await f.extract(me + '/prepare')
  extract.integrity = '{sha}'
  t.matchSnapshot(extract, 'extract')
  await t.spawn(process.execPath, [index], 'test prepared result')
  t.matchSnapshot(fs.readdirSync(me + '/prepare').sort(), 'file list')
  t.match(RUNS[0], {
    stdio: 'inherit',
    banner: false,
  }, 'should run in foreground, but without banner')
})

t.test('missing dir cannot be packed', t => {
  const f = new DirFetcher('file:/this/dir/doesnt/exist', {})
  return t.rejects(f.extract(me + '/nope'), {
    code: 'ENOENT',
  })
})

t.test('when read fails', t => {
  const read = fs.read
  t.teardown(() => fs.read = read)
  const poop = new Error('poop')
  fs.read = (...args) => setTimeout(() => args[args.length - 1](poop))
  const f = new DirFetcher(preparespec, {})
  return t.rejects(f.extract(me + '/nope'), poop)
})

t.test('make bins executable', async t => {
  const file = resolve(__dirname, 'fixtures/bin-object')
  const spec = `file:${relative(process.cwd(), file)}`
  const f = new DirFetcher(spec, {})
  const target = resolve(me, basename(file))
  const res = await f.extract(target)
  const resTest = {
    ...res,
    integrity: '{sha}'
  }
  t.matchSnapshot(resTest, 'results of unpack')
  if (process.platform !== 'win32') {
    t.equal(fs.statSync(target + '/script.js').mode & 0o111, 0o111)
  }
})

t.test('exposes tarCreateOptions method', async t => {
  const simpleOpts = DirFetcher.tarCreateOptions({ _resolved: '/home/foo' })
  t.match(
    simpleOpts,
    {
      cwd: '/home/foo',
      prefix: 'package/',
      portable: true,
      gzip: {
        level: 9,
      },
      mtime: new Date('1985-10-26T08:15:00.000Z'),
    },
    'should return standard options'
  )
})
