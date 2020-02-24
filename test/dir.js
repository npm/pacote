const DirFetcher = require('../lib/dir.js')
const t = require('tap')
const npa = require('npm-package-arg')
const fs = require('fs')
const { promisify } = require('util')

const { relative, resolve, basename } = require('path')

const me = t.testdir()

t.cleanSnapshot = str => str.split(process.cwd()).join('${CWD}')

const abbrev = resolve(__dirname, 'fixtures/abbrev')
const abbrevspec = `file:${relative(process.cwd(), abbrev)}`

t.test('basic', t => {
  const f = new DirFetcher(abbrevspec, {})
  t.same(f.types, ['directory'])
  t.resolveMatchSnapshot(f.packument(), 'packument')
  t.resolveMatchSnapshot(f.manifest(), 'manifest')
  const pj = me + '/abbrev/package.json'
  return t.resolveMatchSnapshot(f.extract(me + '/abbrev'), 'extract')
    .then(() => t.matchSnapshot(require(pj), 'package.json extracted'))
    .then(() => t.matchSnapshot(f.package, 'saved package.json'))
    .then(() => f.manifest().then(mani => t.equal(mani, f.package)))
})

t.test('dir with integrity', t => {
  const f = new DirFetcher(abbrevspec, {
    integrity: 'sha512-whatever-this-is-only-checked-if-we-extract-it',
  })
  t.same(f.types, ['directory'])
  t.resolveMatchSnapshot(f.packument(), 'packument')
  return t.end()
})

const prepare = resolve(__dirname, 'fixtures/prepare-script')
const preparespec = `file:${relative(process.cwd(), prepare)}`

t.test('with prepare script', t => {
  const f = new DirFetcher(preparespec, {})
  t.resolveMatchSnapshot(f.packument(), 'packument')
  t.resolveMatchSnapshot(f.manifest(), 'manifest')
  const index = me + '/prepare/index.js'
  return t.resolveMatchSnapshot(f.extract(me + '/prepare'), 'extract')
    .then(() => t.spawn(process.execPath, [index], 'test prepared result'))
    .then(() => t.matchSnapshot(fs.readdirSync(me + '/prepare').sort(), 'file list'))
})

t.test('missing dir cannot be packed', t => {
  const f = new DirFetcher('file:/this/dir/doesnt/exist', {})
  return t.rejects(f.extract(me + '/nope'), {
    message: `no such file or directory, open '/this/dir/doesnt/exist/package.json`,
    errno: Number,
    code: 'ENOENT',
    syscall: 'open',
    path: '/this/dir/doesnt/exist/package.json',
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
  // node v13.8 swapped out their zlib implementation with chromium's
  // This is slightly faster and results in better compression for most
  // tarballs.  However, it does mean that the snapshotted integrity is
  // not valid.  Check if it's the new one, and if so, use the old instead,
  // so that the snapshot continues to be valid.  At some point, when we
  // drop support for node versions prior to 14, we can just remove this
  // and re-generate the snapshot.
  const oldIntegrity = 'sha512-rlE32nBV7XgKCm0I7YqAewyVPbaRJWUQMZUFLlngGK3imG+som3Hin7d/zPTikWg64tHIxb8VXeeq6u0IRRfmQ=='
  const newIntegrity = 'sha512-J9g/qC58EQ6h3xMyc1lPP2vlmjy6N5symUYih/l9M3A340A1OHPc88oMSAwVdLKj/lT3NbekLXVjU6ONnPbJYg=='
  const resTest = {
    ...res,
    ...(res.integrity === newIntegrity ? { integrity: oldIntegrity }: {}),
  }
  t.matchSnapshot(resTest, 'results of unpack')
  t.equal(fs.statSync(target + '/script.js').mode & 0o111, 0o111)
})
