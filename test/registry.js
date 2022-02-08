const RegistryFetcher = require('../lib/registry.js')
const t = require('tap')
const mr = require('npm-registry-mock')
const port = 18000 + (+process.env.TAP_CHILD_ID || 0)
const me = t.testdir()

t.test('start mock registry', { bail: true }, t => {
  mr({
    port,
    mocks: {
      get: {
        '/no-integrity/-/no-integrity-1.2.3.tgz': [
          200,
          `${__dirname}/fixtures/abbrev-1.1.1.tgz`,
        ],
      },
    },

    plugin (server) {
      server.get('/thing-is-not-here').many().reply(404, { error: 'not found' })
      server.get('/no-tarball').many().reply(200, {
        name: 'no-tarball',
        'dist-tags': { latest: '1.2.3' },
        versions: {
          '1.2.3': {
            name: 'no-tarball',
            version: '1.2.3',
          },
        },
      })
      server.get('/no-integrity').many().reply(200, {
        name: 'no-integrity',
        'dist-tags': { latest: '1.2.3' },
        versions: {
          '1.2.3': {
            name: 'no-integrity',
            version: '1.2.3',
            dist: {
              tarball: `${registry}no-integrity/-/no-integrity-1.2.3.tgz`,
            },
          },
        },
      })
    },
  }, (er, s) => {
    if (er) {
      throw er
    }

    t.parent.teardown(() => s.close())
    t.end()
  })
})

const registry = `http://localhost:${port}/`
const cache = me + '/cache'

t.test('underscore, no tag or version', t => {
  const f = new RegistryFetcher('underscore', { registry, cache, fullReadJson: true })

  return f.resolve().then(r => t.equal(r, `${registry}underscore/-/underscore-1.5.1.tgz`))
    .then(() => f.manifest()).then(m => {
      t.equal(m, f.package)
      t.match(m, { version: '1.5.1', _id: 'underscore@1.5.1' })
      return f.manifest().then(m2 => t.equal(m, m2, 'manifest cached'))
    })
    .then(() => f.extract(me + '/underscore'))
    .then(result => t.same(result, {
      resolved: `${registry}underscore/-/underscore-1.5.1.tgz`,
      // eslint-disable-next-line max-len
      integrity: 'sha1-0r3oF9F2/63olKtxRY5oKhS4bck= sha512-yOc7VukmA45a1D6clUn1mD7Mbc9LcVYAQEXNKSTblzha59hSFJ6cAt90JDoxh05GQnTPI9nk4wjT/I8C/nAMPw==',
      from: 'underscore@',
    }))
})

t.test('scoped, no tag or version', t => {
  const f = new RegistryFetcher('@isaacs/namespace-test', { registry, cache })

  return f.resolve().then(r =>
    t.equal(r, `${registry}@isaacs/namespace-test/-/namespace-test-1.0.0.tgz`))
    .then(() => f.manifest()).then(m => t.match(m, { version: '1.0.0' }))
    .then(() => f.extract(me + '/namespace-test'))
    .then(result => t.same(result, {
      resolved: `${registry}@isaacs/namespace-test/-/namespace-test-1.0.0.tgz`,
      // eslint-disable-next-line max-len
      integrity: 'sha512-5ZYe1LgwHIaag0p9loMwsf5N/wJ4XAuHVNhSO+qulQOXWnyJVuco6IZjo+5u4ZLF/GimdHJcX+QK892ONfOCqQ==',
      from: '@isaacs/namespace-test@',
    }))
})

t.test('provide invalid integrity, fails to unpack', async t => {
  const f = new RegistryFetcher('@isaacs/namespace-test', {
    registry,
    cache,
    // eslint-disable-next-line max-len
    integrity: 'sha512-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
  })
  return t.rejects(f.extract(me + '/bad-integrity'), {
    code: 'EINTEGRITY',
  })
})

t.test('provide invalid integrity, fails to manifest', async t => {
  const f = new RegistryFetcher('@isaacs/namespace-test', {
    registry,
    cache,
    // eslint-disable-next-line max-len
    integrity: 'sha512-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
  })
  return t.rejects(f.manifest(), {
    code: 'EINTEGRITY',
  })
})

t.test('provide different type of integrity, concats', async t => {
  const f = new RegistryFetcher('@isaacs/namespace-test', {
    registry,
    cache,
    integrity: 'sha-a/la/beef/this/is/a/very/bad/joke/im/so/sorry',
  })
  return f.manifest().then(mani =>
    t.equal(
      mani._integrity,
      'sha-a/la/beef/this/is/a/very/bad/joke/im/so/sorry ' +
      // eslint-disable-next-line max-len
      'sha512-5ZYe1LgwHIaag0p9loMwsf5N/wJ4XAuHVNhSO+qulQOXWnyJVuco6IZjo+5u4ZLF/GimdHJcX+QK892ONfOCqQ=='
    ))
})

t.test('provide matching integrity, totes ok', async t => {
  const f = new RegistryFetcher('@isaacs/namespace-test', {
    registry,
    cache,
    // eslint-disable-next-line max-len
    integrity: 'sha512-5ZYe1LgwHIaag0p9loMwsf5N/wJ4XAuHVNhSO+qulQOXWnyJVuco6IZjo+5u4ZLF/GimdHJcX+QK892ONfOCqQ==',
  })
  return f.manifest().then(mani =>
    t.equal(
      mani._integrity,
      // eslint-disable-next-line max-len
      'sha512-5ZYe1LgwHIaag0p9loMwsf5N/wJ4XAuHVNhSO+qulQOXWnyJVuco6IZjo+5u4ZLF/GimdHJcX+QK892ONfOCqQ=='
    ))
})

t.test('404 fails with E404', t => {
  const f = new RegistryFetcher('thing-is-not-here', { registry, cache })
  return t.rejects(f.resolve(), { code: 'E404' }).then(() =>
    t.equal(f.fullMetadata, true, 'tried again with got full metadata'))
})

t.test('respect default tag', async t => {
  const f = new RegistryFetcher('underscore', { registry, cache, defaultTag: 'stable' })
  t.equal(f.spec.raw, 'underscore@stable')
  t.equal(await f.resolve(), `${registry}underscore/-/underscore-1.5.1.tgz`)
})

t.test('fail resolution if no dist.tarball', t => {
  const f = new RegistryFetcher('no-tarball', { registry, cache })
  return t.rejects(f.resolve(), {
    message: 'Invalid package manifest: no `dist.tarball` field',
    package: 'no-tarball',
  })
})

t.test('a manifest that lacks integrity', async t => {
  const packumentCache = new Map()
  const f = new RegistryFetcher('no-integrity', { registry, cache, packumentCache })
  const mani = await f.manifest()
  t.notOk(mani._integrity, 'should have no integrity')
  const result = await f.extract(me + '/no-integrity')
  t.same(result, {
    resolved: `${registry}no-integrity/-/no-integrity-1.2.3.tgz`,
    // eslint-disable-next-line max-len
    integrity: 'sha512-nne9/IiQ/hzIhY6pdDnbBtz7DjPTKrY00P/zvPSm5pOFkl6xuGrGnXn/VtTNNfNtAfZ9/1RtehkszU9qcTii0Q==',
    from: 'no-integrity@',
  }, 'calculated integrity anyway')
  // load a second one, but get the cached copy
  const f2 = new RegistryFetcher('no-integrity', { registry, cache, packumentCache })
  t.equal(await f.packument(), await f2.packument(), 'serve cached packument')
})

t.test('packument that has been cached', async t => {
  const packumentUrl = `${registry}asdf`
  const packument = {
    cached: 'packument',
    name: 'asdf',
    versions: {
      '1.2.3': {
        name: 'asdf',
        version: '1.2.3',
        dist: {
          tarball: `${registry}/asdf/-/asdf-1.2.3.tgz`,
          // eslint-disable-next-line max-len
          integrity: 'sha512-nne9/IiQ/hzIhY6pdDnbBtz7DjPTKrY00P/zvPSm5pOFkl6xuGrGnXn/VtTNNfNtAfZ9/1RtehkszU9qcTii0Q==',
        },
      },
    },
  }
  const packumentCache = new Map([[packumentUrl, packument]])
  const f = new RegistryFetcher('asdf@1.2', { registry, cache, packumentCache })
  t.equal(await f.packument(), packument, 'got cached packument')
})

t.test('packument that falls back to fullMetadata', t => {
  const http = require('http')
  const packument = {
    name: 'no-tarball',
    'dist-tags': { latest: '1.2.3' },
    versions: {
      '1.2.3': {
        name: 'no-tarball',
        version: '1.2.3',
      },
    },
  }

  let sent404 = false
  const server = http.createServer((req, res) => {
    res.setHeader('connection', 'close')
    if (req.headers.accept.includes('application/vnd.npm.install-v1+json')) {
      sent404 = true
      res.statusCode = 404
      return res.end(JSON.stringify({ error: 'corgi not found, try again' }))
    }
    res.end(JSON.stringify(packument))
  })

  const packumentCache = new Map()
  const registry = `http://localhost:${port + 1000}`
  server.listen(port + 1000, async () => {
    const f = new RegistryFetcher('no-tarball', {
      registry,
      cache,
      packumentCache,
    })
    const paku = await f.packument()
    t.match(paku, packument, 'got packument (eventually)')
    t.equal(sent404, true, 'sent a 404 for the missing corgi doc')
    server.close()
    t.end()
  })
})
