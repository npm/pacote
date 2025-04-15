const runScript = require('@npmcli/run-script')
const RUNS = []
const t = require('tap')
const Arborist = require('@npmcli/arborist')
const fs = require('node:fs')
const { relative, resolve, basename } = require('node:path')
const cleanSnapshot = require('./helpers/clean-snapshot.js')
const scriptMode = require('./helpers/script-mode.js')

const loadActual = async (path) => {
  const arb = new Arborist({ path })
  const tree = await arb.loadActual()
  return tree
}

const DirFetcher = t.mock('../lib/dir.js', {
  '@npmcli/run-script': (opts) => {
    RUNS.push(opts)
    // don't actually inherit or print banner in the test, though.
    return runScript({ ...opts, stdio: 'pipe', banner: false })
  },
})

const me = t.testdir()

t.cleanSnapshot = str => cleanSnapshot(str)
  .replace(/"integrity": ".*",/g, '"integrity": "{integrity}",')

const abbrev = resolve(__dirname, 'fixtures/abbrev')
const abbrevspec = `file:${relative(process.cwd(), abbrev)}`

t.test('basic', async t => {
  const f = new DirFetcher(abbrevspec, { tree: await loadActual(abbrev) })
  t.same(f.types, ['directory'])
  t.resolveMatchSnapshot(f.packument(), 'packument')
  t.resolveMatchSnapshot(f.manifest(), 'manifest')
  const pj = me + '/abbrev/package.json'
  return t.resolveMatchSnapshot(f.extract(me + '/abbrev'), 'extract')
    .then(() => t.matchSnapshot(require(pj), 'package.json extracted'))
    .then(() => t.matchSnapshot(f.package, 'saved package.json'))
    .then(() => f.manifest().then(mani => t.equal(mani, f.package)))
})

t.test('dir with integrity', async t => {
  const f = new DirFetcher(abbrevspec, {
    integrity: 'sha512-whatever-this-is-only-checked-if-we-extract-it',
    tree: await loadActual(abbrev),
  })
  t.same(f.types, ['directory'])
  return t.resolveMatchSnapshot(f.packument(), 'packument')
})

const prepare = resolve(__dirname, 'fixtures/prepare-script')
const preparespec = `file:${relative(process.cwd(), prepare)}`

t.test('with prepare script', async t => {
  RUNS.length = 0
  const f = new DirFetcher(preparespec, { tree: await loadActual(prepare) })
  t.resolveMatchSnapshot(f.packument(), 'packument')
  t.resolveMatchSnapshot(f.manifest(), 'manifest')
  const index = me + '/prepare/index.js'
  return t.resolveMatchSnapshot(f.extract(me + '/prepare'), 'extract')
    .then(() => t.spawn(process.execPath, [index], 'test prepared result'))
    .then(() => t.matchSnapshot(fs.readdirSync(me + '/prepare').sort(), 'file list'))
    .then(() => t.match(RUNS[0], {
      stdio: 'pipe',
    }, 'should run in background'))
})

t.test('with prepare script with scriptshell configuration', async t => {
  RUNS.length = 0
  const f = new DirFetcher(preparespec, { tree: await loadActual(prepare), scriptShell: 'sh' })
  t.resolveMatchSnapshot(f.packument(), 'packument')
  t.resolveMatchSnapshot(f.manifest(), 'manifest')
  const index = me + '/prepare/index.js'
  return t.resolveMatchSnapshot(f.extract(me + '/prepare'), 'extract')
    .then(() => t.spawn(process.execPath, [index], 'test prepared result'))
    .then(() => t.matchSnapshot(fs.readdirSync(me + '/prepare').sort(), 'file list'))
    .then(() => t.match(RUNS,
      [{
        stdio: 'pipe',
        scriptShell: 'sh',
      }], 'should run in background and use scriptshell configuration'))
})

t.test('responds to foregroundScripts: true', async t => {
  RUNS.length = 0
  const opt = { foregroundScripts: true, tree: await loadActual(prepare) }
  const f = new DirFetcher(preparespec, opt)
  t.resolveMatchSnapshot(f.packument(), 'packument')
  t.resolveMatchSnapshot(f.manifest(), 'manifest')
  const index = me + '/prepare/index.js'
  return t.resolveMatchSnapshot(f.extract(me + '/prepare'), 'extract')
    .then(() => t.spawn(process.execPath, [index], 'test prepared result'))
    .then(() => t.matchSnapshot(fs.readdirSync(me + '/prepare').sort(), 'file list'))
    .then(() => t.match(RUNS[0], {
      stdio: 'inherit',
    }, 'should run in foreground'))
})

t.test('missing dir cannot be packed', async t => {
  const f = new DirFetcher('file:/this/dir/doesnt/exist', { tree: await loadActual() })
  if (process.platform !== 'win32') {
    return t.rejects(f.extract(me + '/nope'), {
      message: `no such file or directory, open '/this/dir/doesnt/exist/package.json`,
      errno: Number,
      code: 'ENOENT',
      syscall: 'open',
      path: '/this/dir/doesnt/exist/package.json',
    })
  } else {
    return t.rejects(f.extract(me + '/nope'), {
      errno: Number,
      code: 'ENOENT',
      syscall: 'open',
      path: new RegExp('\\\\this\\\\dir\\\\doesnt\\\\exist\\\\package.json'),
      name: 'Error',
    })
  }
})

t.test('when read fails', async t => {
  const read = fs.read
  t.teardown(() => fs.read = read)
  const poop = new Error('poop')
  fs.read = (...args) => setTimeout(() => args[args.length - 1](poop))
  const f = new DirFetcher(preparespec, { tree: await loadActual() })
  return t.rejects(f.extract(me + '/nope'), poop)
})

t.test('make bins executable', async t => {
  const file = resolve(__dirname, 'fixtures/bin-object')
  const spec = `file:${relative(process.cwd(), file)}`
  const f = new DirFetcher(spec, { tree: await loadActual(file) })
  const target = resolve(me, basename(file))
  const res = await f.extract(target)
  // node v13.8 swapped out their zlib implementation with chromium's
  // This is slightly faster and results in better compression for most
  // tarballs.  However, it does mean that the snapshotted integrity is
  // not valid.  Check if it's the new one, and if so, use the old instead,
  // so that the snapshot continues to be valid.  At some point, when we
  // drop support for node versions prior to 14, we can just remove this
  // and re-generate the snapshot.

  // eslint-disable-next-line max-len
  const oldIntegrity = 'sha512-rlE32nBV7XgKCm0I7YqAewyVPbaRJWUQMZUFLlngGK3imG+som3Hin7d/zPTikWg64tHIxb8VXeeq6u0IRRfmQ=='
  // eslint-disable-next-line max-len
  const newIntegrity = 'sha512-J9g/qC58EQ6h3xMyc1lPP2vlmjy6N5symUYih/l9M3A340A1OHPc88oMSAwVdLKj/lT3NbekLXVjU6ONnPbJYg=='
  const resTest = {
    ...res,
    ...(res.integrity === newIntegrity ? { integrity: oldIntegrity } : {}),
  }
  t.matchSnapshot(resTest, 'results of unpack')
  t.equal(fs.statSync(target + '/script.js').mode & scriptMode(), scriptMode())
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

t.test('fails without a tree or constructor', async t => {
  const f = new DirFetcher(abbrevspec, {})
  t.rejects(() => f.extract(me + '/prepare'))
})

t.test('with prepare script and ignoreScripts true', async t => {
  let shouldNotBePopulated = false

  const DirFetcherIsolate = t.mock('../lib/dir.js', {
    '@npmcli/run-script': () => {
      shouldNotBePopulated = true
    },
  })

  const dir = t.testdir({
    'package.json': JSON.stringify({
      name: 'meow',
      version: '1.0.0',
      scripts: {
        prepare: 'noop',
      },
    }),
  })
  const f = new DirFetcherIsolate(`file:${relative(process.cwd(), dir)}`, {
    tree: await loadActual(dir),
    ignoreScripts: true,
  })
  await f.extract(me + '/prepare-ignore')
  t.ok(!shouldNotBePopulated)
})

const prepack = resolve(__dirname, 'fixtures/prepack-script')
const prepackspec = `file:${relative(process.cwd(), prepack)}`

t.test('with prepack script with _PACOTE_FROM_GIT_ is enabled', async t => {
  RUNS.length = 0
  process.env._PACOTE_FROM_GIT_ = 'yes'
  t.teardown(() => {
    delete process.env._PACOTE_FROM_GIT_
  })
  const f = new DirFetcher(prepackspec, { tree: await loadActual(prepack) })
  t.resolveMatchSnapshot(f.packument(), 'packument')
  t.resolveMatchSnapshot(f.manifest(), 'manifest')
  const index = me + '/prepack/index.js'
  return t.resolveMatchSnapshot(f.extract(me + '/prepack'), 'extract')
    .then(() => t.spawn(process.execPath, [index], 'test prepacked result'))
    .then(() => t.matchSnapshot(fs.readdirSync(me + '/prepack').sort(), 'file list'))
    .then(() => t.match(RUNS[0], {
      stdio: 'pipe',
    }, 'should run in background'))
})

t.test('with prepack script and _PACOTE_FROM_GIT_ is disabled', async t => {
  let shouldNotBePopulated = false

  const DirFetcherIsolate = t.mock('../lib/dir.js')

  const dir = t.testdir({
    'package.json': JSON.stringify({
      name: 'meow',
      version: '1.0.0',
      scripts: {
        prepack: 'noop',
      },
    }),
  })
  const f = new DirFetcherIsolate(`file:${relative(process.cwd(), dir)}`, {
    tree: await loadActual(dir),
  })
  await f.extract(me + '/prepack-ignore')
  t.ok(!shouldNotBePopulated)
})
