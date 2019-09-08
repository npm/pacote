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

const cacache = require('cacache')
const byDigest = cacache.get.stream.byDigest
const Minipass = require('minipass')

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

t.test('tarballFile', t => {
  const target = resolve(me, 'tarball-file')
  if (fakeSudo)
    process.chownLog.length = 0

  t.test('basic copy', t =>
    new FileFetcher(abbrevspec, { cache })
      .tarballFile(target + '/basic/1.tgz'))

  t.test('again, folder already created', t =>
    new FileFetcher(abbrevspec, { cache })
      .tarballFile(target + '/basic/2.tgz'))

  t.test('check it', t => {
    const one = fs.readFileSync(target + '/basic/1.tgz')
    const two = fs.readFileSync(target + '/basic/2.tgz')
    const expect = fs.readFileSync(abbrev)
    t.equal(one.toString('hex'), expect.toString('hex'), '1.tgz')
    t.equal(two.toString('hex'), expect.toString('hex'), '2.tgz')
    t.end()
  })

  t.test('fs write stream error', t => {
    const fsm = require('fs-minipass')
    const WriteStream = fsm.WriteStream
    fsm.WriteStream = class extends WriteStream {
      emit (ev, data) {
        if (ev === 'close')
          super.emit('error', new Error('poop'))
        else
          super.emit(ev, data)
      }
    }

    return t.rejects(new FileFetcher(abbrevspec, {cache})
      .tarballFile(target + '/err.tgz'), { message: 'poop' })
      .then(() => fsm.WriteStream = WriteStream)
  })

  t.test('file not found', t => {
    const f = abbrev + '-not-found.tgz'
    return t.rejects(new FileFetcher(f, {cache})
      .tarballFile(target + '/not-found.tgz'), {
        message: `no such file or directory, open '${f}'`,
        errno: Number,
        code: 'ENOENT',
        syscall: 'open',
        path: f,
      })
  })

  t.end()
})

t.test('extract', t => {
  const target = resolve(me, 'extract')

  const check = sub => (result) => {
    const { resolved, integrity } = result
    t.test(sub, t => {
      t.equal(resolved, abbrev, 'resolved to filename')
      t.equal(integrity, abbrevMani._integrity, 'integrity match')
      const pj = require(`${target}/${sub}/package.json`)
      t.equal(pj.name, 'abbrev', 'name in package.json')
      t.equal(pj.version, '1.1.1', 'version in package.json')
      t.end()
    })
  }

  if (fakeSudo)
    process.chownLog.length = 0

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
    .then(() => {
      // test a bad cache entry
      cacache.get.stream.byDigest = () => {
        const badstream = new Minipass()
        badstream.name = 'BAD STREAM'
        badstream.write(fs.readFileSync(abbrev))
        badstream.end('wrong content, not even a tarball ffs')
        return badstream
      }
      const logs = []
      const onlog = (...l) => logs.push(l)
      process.on('log', onlog)
      return new FileFetcher(abbrevspec, {
        cache,
        integrity: abbrevMani._integrity,
        preferOnline: false,
      }).extract(target + '/badcache')
        .then(({resolved, integrity}) => {
          t.same(logs, [
            [ 'warn', 'tar', 'zlib: incorrect header check' ],
            [
              'warn',
              'tarball',
              'cached data for file:test/fixtures/abbrev-1.1.1.tgz ' +
              '(sha512-nne9/IiQ/hzIhY6pdDnbBtz7DjPTKrY00P/zvPSm5pOF' +
              'kl6xuGrGnXn/VtTNNfNtAfZ9/1RtehkszU9qcTii0Q==) seems ' +
              'to be corrupted. Refreshing cache.'
            ],
            [
              'silly',
              'tarball',
              'no local data for file:test/fixtures/abbrev-1.1.1.tgz. ' +
              'Extracting by manifest.'
            ]
          ], 'got expected logs')
          process.removeListener('log', onlog)
          cacache.get.stream.byDigest = byDigest
          return check('badcache')({resolved, integrity})
        })
    })
    .then(() => {
      // test a non-retriable error.
      cacache.get.stream.byDigest = () => {
        const badstream = new Minipass()
        badstream.on('end', () => {
          throw new Error('poop')
        })
        badstream.end(fs.readFileSync(abbrev))
        return badstream
      }
      return t.rejects(new FileFetcher(abbrevspec, {
        cache,
        integrity: abbrevMani._integrity,
        preferOnline: false,
      }).extract(target + '/nonretriable'), { message: 'poop' })
    })
    .then(() => cacache.get.stream.byDigest = byDigest)

    .then(() => {
      const f = abbrev + '-not-here.tgz'
      // a non-retriable error that doesn't come from the cache
      return t.rejects(new FileFetcher(f, { cache })
        .extract(target + '/file-not-found'), {
          message: `no such file or directory, open '${f}'`,
          errno: Number,
          code: 'ENOENT',
          syscall: 'open',
          path: f,
        })
    })

    .then(() => {
      const logs = []
      const onlog = (...l) => logs.push(l)
      process.on('log', onlog)
      return new FileFetcher(abbrevspec, {
        cache,
        integrity: 'sha512-0',
        resolved: abbrev,
      }).extract(target + '/unintegritous')
        .then(() => t.fail('expected failing promise'))
        .catch(er => {
          t.match(er, {
            message: 'sha512-0 ' +
            'integrity checksum failed when using sha512: wanted sha512-' +
            '0 but got sha512-nne9/IiQ/hzIhY6pdDnbBtz7DjPTKrY00P/zvPSm5p' +
            'OFkl6xuGrGnXn/VtTNNfNtAfZ9/1RtehkszU9qcTii0Q==. (2301 bytes)',
            code: 'EINTEGRITY',
            found: Object,
            expected: [
              {
                source: 'sha512-0',
                algorithm: 'sha512',
                digest: '0',
                options: []
              }
            ],
            algorithm: 'sha512',
            sri: Object,
          }, 'got expected error')
          t.same(logs, [
            [
              'silly',
              'tarball',
              'no local data for file:test/fixtures/abbrev-1.1.1.tgz. ' +
              'Extracting by manifest.'
            ],
            [
              'warn',
              'tarball',
              'tarball data for file:test/fixtures/abbrev-1.1.1.tgz ' +
              '(sha512-0) seems to be corrupted. Trying again.'
            ],
            [
              'warn',
              'tarball',
              'tarball data for file:test/fixtures/abbrev-1.1.1.tgz ' +
              '(sha512-0) seems to be corrupted. Trying again.'
            ]
          ], 'got expected logs')
          process.removeListener('log', onlog)
        })
    })

    // extract into existing folder, for coverage of some other code paths
    .then(() => mkdirp.sync(target + '/weird'))
    // some weird thing with links and such
    .then(() =>
      new FileFetcher(weirdspec, { cache }).extract(target + '/weird'))
    .then(() => {
      const missing = [
        'index-hardlink.js',
        'index-symlink.js',
        '.gitignore',
        'lib/.gitignore',
        'no-gitignore-here/.gitignore',
      ]
      const dir = target + '/weird/'
      t.ok(fs.statSync(dir + '/no-gitignore-here/.npmignore'),
        'renamed .gitignore')
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
