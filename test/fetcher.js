const fakeSudo = process.argv[2] === 'fake-sudo'
const fs = require('fs')
process.chownLog = []
if (fakeSudo) {
  process.realUid = process.getuid()
  process.getuid = () => 0
  const fakeChown = type => (path, uid, gid, cb) => {
    process.chownLog.push({type, path, uid, gid})
    process.nextTick(cb)
  }
  const chown = fs.chown
  const lchown = fs.lchown
  fs.chown = fakeChown('chown')
  fs.lchown = fakeChown('lchown')
}

const { relative, resolve, basename } = require('path')
const t = require('tap')
const me = t.testdir()
const Fetcher = require('../lib/fetcher.js')
t.cleanSnapshot = s => s.split(process.cwd()).join('{CWD}')

const npa = require('npm-package-arg')
const { promisify } = require('util')
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

t.test('do not mutate opts object passed in', t => {
  const opts = {}
  const f = new FileFetcher(abbrevspec, opts)
  f.integrity = 'sha512-somekindofintegral'
  t.strictSame(opts, {})
  t.match(f.integrity, {
    sha512: [
      {
        source: 'sha512-somekindofintegral',
        digest: 'somekindofintegral',
        algorithm: 'sha512',
        options: [],
      },
    ],
  })
  t.end()
})

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
  .then(data => t.same(data, fs.readFileSync(abbrev), 'with integrity')))

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
          t.match(logs, [
            [ 'warn', 'tar', 'zlib: incorrect header check' ],
            [
              'silly',
              'tar',
              { message: 'zlib: incorrect header check',
                errno: Number,
                code: 'Z_DATA_ERROR',
                recoverable: false,
                tarCode: 'TAR_ABORT'
              }
            ],
            [
              'warn',
              'tarball',
              'cached data for file:test/fixtures/abbrev-1.1.1.tgz (sha512-' +
              'nne9/IiQ/hzIhY6pdDnbBtz7DjPTKrY00P/zvPSm5pOFkl6xuGrGnXn/VtTN' +
              'NfNtAfZ9/1RtehkszU9qcTii0Q==) seems to be corrupted. ' +
              'Refreshing cache.'
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
})

t.test('extract into folder that already has a package in it', t => {
  const dir = t.testdir({
    'package.json': JSON.stringify({
      name: 'weird',
      version: '1.2.3',
      bundleDependencies: ['foo'],
      dependencies: {
        foo: '*',
        bar: '*',
      }
    }),
    node_modules: {
      '.bin': {
        foo: 'foo',
        bar: 'bar',
      },
      foo: {
        'package.json': JSON.stringify({
          bin: 'foo',
          name: 'foo',
          version:'1.2.3',
        }),
        'index.js': 'console.log("foo")',
      },
      bar: {
        bin: 'bar',
        'package.json': JSON.stringify({name: 'bar',version:'1.2.3'}),
        'index.js': 'console.log("bar")',
      },
    },
  })
  // some weird thing with links and such
  // will remove weird and weird/foo bundle dep, but not weird/bar
  return new FileFetcher(weirdspec, {cache}).extract(dir).then(() => {
    const missing = [
      'index-hardlink.js',
      'index-symlink.js',
      '.gitignore',
      'lib/.gitignore',
      'no-gitignore-here/.gitignore',
      'node_modules/foo',
      'node_modules/.bin/foo',
    ]
    missing.forEach(f =>
      t.throws(() => fs.statSync(dir + '/' + f), 'excluded or removed' + f))

    const present = [
      'no-gitignore-here/.npmignore',
      'node_modules/bar/package.json',
      'node_modules/bar/index.js',
      'node_modules/.bin/bar',
    ]
    present.forEach(f =>
      t.ok(fs.statSync(dir + '/' + f), 'still have file at ' + f))
  })
})

t.test('a non-retriable cache error', t => {
  const res = {}
  const target = resolve(me, 'non-retriable-failure')
  const mutateFS = require('mutate-fs')
  const cacache = require('cacache')
  const data = fs.readFileSync(abbrev)
  const poop = new Error('poop')
  poop.code = 'LE_POOP'
  t.teardown(mutateFS.fail('read', poop))
  t.teardown(() => process.chownLog.length = 0)
  return cacache.put(cache, 'any-old-key', data, {
    integrity: abbrevMani._integrity,
  }).then(() => t.rejects(new FileFetcher(abbrev, {
    cache,
    integrity: abbrevMani._integrity,
  }).manifest(), poop))
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
      'npm:foo@2': 'RegistryFetcher',
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

t.test('make bins executable', async t => {
  const file = resolve(__dirname, 'fixtures/bin-object.tgz')
  const spec = `file:${relative(process.cwd(), file)}`
  const f = new FileFetcher(spec, {})
  // simulate a fetcher that already has a manifest
  const manifest = require('./fixtures/bin-object/package.json')
  f.package = manifest
  const target = resolve(me, basename(file, '.tgz'))
  const res = await f.extract(target)
  t.matchSnapshot(res, 'results of unpack')
  t.equal(fs.statSync(target + '/script.js').mode & 0o111, 0o111)
})

t.test('set integrity, pick default algo', t => {
  const opts = {
    integrity: 'sha1-foobar sha256-barbaz sha512-glorp',
    defaultIntegrityAlgorithm: 'sha256',
  }
  const f = new FileFetcher('pkg.tgz', opts)
  t.equal(f.pickIntegrityAlgorithm(), 'sha512')
  t.isa(f.opts.integrity, Object)
  const i = f.integrity
  f.integrity = null
  t.equal(f.integrity, i, 'cannot remove integrity')
  const g = new FileFetcher('pkg.tgz', { defaultIntegrityAlgorithm: 'sha256' })
  t.equal(g.pickIntegrityAlgorithm(), 'sha256')
  t.end()
})
