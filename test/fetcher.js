const fakeSudo = process.argv[2] === 'fake-sudo'
const fs = require('fs')
process.chownLog = []
if (fakeSudo) {
  process.realUid = process.getuid()
  process.getuid = () => 0
  const fakeChown = type => (path, uid, gid, cb) => {
    process.chownLog.push({type, path, uid, gid})
    //;(type === 'chown' ? chown : lchown)(path, uid, gid, cb)
    process.nextTick(cb)
  }
  const chown = fs.chown
  const lchown = fs.lchown
  fs.chown = fakeChown('chown')
  fs.lchown = fakeChown('lchown')
}

const { relative, resolve, basename } = require('path')
const me = resolve(__dirname, basename(__filename, '.js'))
const Fetcher = require('../lib/fetcher.js')
const t = require('tap')
if (!fakeSudo)
  t.teardown(() => require('rimraf').sync(me))

const npa = require('npm-package-arg')
const { promisify } = require('util')
const rimraf = promisify(require('rimraf'))
const mkdirp = require('mkdirp')

const _tarballFromResolved = Symbol.for('pacote.Fetcher._tarballFromResolved')

const abbrev = resolve(__dirname, 'fixtures/abbrev-1.1.1.tgz')
const abbrevspec = `file:${relative(process.cwd(), abbrev)}`
const abbrevMani = require('./fixtures/abbrev-manifest-min.json')
const weird = resolve(__dirname, 'fixtures/weird-pkg.tgz')
const weirdspec = `file:${relative(process.cwd(), weird)}`
const ignore = resolve(__dirname, 'fixtures/ignore-pkg.tgz')
const ignorespec = `file:${relative(process.cwd(), ignore)}`

// we actually use a file fetcher for this, because we need implementations
const FileFetcher = require('../lib/file.js')
const cache = resolve(me, 'cache')

t.test('tarball data', t =>
  new FileFetcher(abbrevspec, { cache }).tarball()
  .then(data => {
    t.equal(data.toString('hex'), fs.readFileSync(abbrev, 'hex'), 'without integrity')
    t.equal(data.integrity, abbrevMani._integrity, 'integrity calculated')
  })
  .then(() => new FileFetcher(abbrevspec, {
    cache,
    integrity: abbrevMani._integrity,
  }).tarball())
  .then(data => t.equal(data.toString('hex'), fs.readFileSync(abbrev, 'hex'), 'with integrity')))

t.test('extract', t => {
  const target = resolve(me, 'extract')

  const check = sub => (result) => {
    const { resolved, integrity } = result
    t.equal(resolved, abbrev, 'resolved to filename')
    t.equal(integrity, abbrevMani._integrity, 'integrity match')
    const pj = require(`${target}/${sub}/package.json`)
    t.equal(pj.name, 'abbrev', 'name in package.json')
    t.equal(pj.version, '1.1.1', 'version in package.json')
  }

  return new FileFetcher(abbrevspec, { cache }).extract(target + '/uncached')
    .then(check('uncached'))
    .then(() => new FileFetcher(abbrevspec, {
      cache,
      integrity: abbrevMani._integrity,
      resolved: abbrev,
    }).extract(target + '/cached'))
    .then(check('cached'))
    .then(!fakeSudo ? () => {} : () => {
      t.notEqual(process.chownLog.length, 0, 'did some chowns')
      const log = { uid: process.realUid, gid: process.getgid() }
      process.chownLog.forEach(entry => t.match(entry, log, 'chowned to me'))
      process.chownLog.length = 0
    })
    // extract into existing folder, for coverage of some other code paths
    .then(() => mkdirp.sync(target + '/weird'))
    // some weird thing with links and such
    .then(() => new FileFetcher(weirdspec, { cache }).extract(target + '/weird'))
    .then(() => {
      const missing = [
        'index-hardlink.js',
        'index-symlink.js',
        '.gitignore',
        'lib/.gitignore',
        'no-gitignore-here/.gitignore',
      ]
      const dir = target + '/weird/'
      t.ok(fs.statSync(dir + '/no-gitignore-here/.npmignore'), 'renamed .gitignore')
      missing.forEach(f =>
        t.throws(() => fs.statSync(dir + '/' + f), 'excluded ' + f))
    })
})

// no need to do some of these basic tests in sudo mode
if (!fakeSudo) {

t.spawn(process.execPath, [__filename, 'fake-sudo'], 'fake sudo mode')

t.test('enjoyBy implies full metadata', t => {
  const f = new Fetcher('foo', { enjoyBy: new Date('1979-07-01') })
  t.equal(f.fullMetadata, true)
  t.end()
})

t.test('various projectiles', t => {
  t.throws(() => new Fetcher(), { message: 'options object is required' })
  const f = new Fetcher('foo', {})
  // base class doesn't implement functionality
  const expect = {
    message: 'not implemented in this fetcher type: FetcherBase'
  }
  t.rejects(f.resolve(), expect)
  f.resolved = 'fooblz'
  t.resolveMatch(f.resolve(), 'fooblz', 'has resolved')
  t.rejects(f.extract('target'), expect)
  t.rejects(f.manifest(), expect)
  t.rejects(f.packument(), expect)
  t.rejects(f.tarball(), expect)
  const foo = npa('foo@bar')
  foo.type = 'blerg'
  t.throws(() => Fetcher.get(foo, {}), {
    message: 'Unknown spec type: blerg'
  })

  class KidFetcher extends Fetcher {
    get types () { return ['kid'] }
  }
  t.throws(() => new KidFetcher('foo', {}), {
    message: `Wrong spec type (tag) for KidFetcher. Supported types: kid`
  })
  t.end()
})

t.test('fetcher.get', t => {
  const specToType = {
    'foo': 'RegistryFetcher',
    'foo@bar': 'RegistryFetcher',
    'foo@1.2': 'RegistryFetcher',
    'foo@1.2.3': 'RegistryFetcher',
    '@foo/bar': 'RegistryFetcher',
    '@foo/bar@1.2': 'RegistryFetcher',
    '@foo/bar@1.2.3': 'RegistryFetcher',
    'foo.tgz': 'FileFetcher',
    '/path/to/foo': 'DirFetcher',
    'isaacs/foo': 'GitFetcher',
    'git+https://github.com/isaacs/foo': 'GitFetcher',
    'https://server.com/foo.tgz': 'RemoteFetcher',
  }
  for (const [spec, type] of Object.entries(specToType)) {
    t.equal(Fetcher.get(spec).type, type)
  }

  t.end()
})

}
