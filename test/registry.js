const RegistryFetcher = require('../lib/registry.js')
const t = require('tap')
const mr = require('npm-registry-mock')
const tnock = require('./fixtures/tnock')
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

t.test('provide matching integrity, totes ok, includes signature', async t => {
  const f = new RegistryFetcher('@isaacs/namespace-test', {
    registry,
    cache,
    // eslint-disable-next-line max-len
    integrity: 'sha512-5ZYe1LgwHIaag0p9loMwsf5N/wJ4XAuHVNhSO+qulQOXWnyJVuco6IZjo+5u4ZLF/GimdHJcX+QK892ONfOCqQ==',
  })
  return f.manifest().then(mani => {
    t.match(mani, {
      // eslint-disable-next-line max-len
      _integrity: 'sha512-5ZYe1LgwHIaag0p9loMwsf5N/wJ4XAuHVNhSO+qulQOXWnyJVuco6IZjo+5u4ZLF/GimdHJcX+QK892ONfOCqQ==',
      _signatures: [
        {
          keyid: 'SHA256:jl3bwswu80PjjokCgh0o2w5c2U4LhQAE57gj9cz1kzA',
          // eslint-disable-next-line max-len
          sig: 'MEQCIHXwKYe70+xcDOvFhM1etZQFUKEwz9VarppUbp5/Ie1+AiAM7aZcT1a2JR0oF/XwjNb13YEHwiagnDapLgYbklRvtA==',
        },
      ],
    })
  })
})

t.test('verifySignatures valid signature', async t => {
  const f = new RegistryFetcher('@isaacs/namespace-test', {
    registry,
    cache,
    verifySignatures: true,
    [`//localhost:${port}/:_keys`]: [{
      expires: null,
      keyid: 'SHA256:jl3bwswu80PjjokCgh0o2w5c2U4LhQAE57gj9cz1kzA',
      keytype: 'ecdsa-sha2-nistp256',
      scheme: 'ecdsa-sha2-nistp256',
      // eslint-disable-next-line max-len
      key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE1Olb3zMAFFxXKHiIkQO5cJ3Yhl5i6UPp+IhuteBJbuHcA5UogKo0EWtlWwW6KSaKoTNEYL7JlCQiVnkhBktUgg==',
      // eslint-disable-next-line max-len
      pemkey: '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE1Olb3zMAFFxXKHiIkQO5cJ3Yhl5i6UPp+IhuteBJbuHcA5UogKo0EWtlWwW6KSaKoTNEYL7JlCQiVnkhBktUgg==\n-----END PUBLIC KEY-----',
    }],
  })
  return f.manifest().then(mani => {
    t.ok(mani._signatures)
    t.ok(mani._integrity)
  })
})

t.test('verifySignatures expired signature', async t => {
  const f = new RegistryFetcher('@isaacs/namespace-test', {
    registry,
    cache,
    verifySignatures: true,
    [`//localhost:${port}/:_keys`]: [{
      expires: '2010-01-01',
      keyid: 'SHA256:jl3bwswu80PjjokCgh0o2w5c2U4LhQAE57gj9cz1kzA',
      keytype: 'ecdsa-sha2-nistp256',
      scheme: 'ecdsa-sha2-nistp256',
      // eslint-disable-next-line max-len
      key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE1Olb3zMAFFxXKHiIkQO5cJ3Yhl5i6UPp+IhuteBJbuHcA5UogKo0EWtlWwW6KSaKoTNEYL7JlCQiVnkhBktUgg==',
      // eslint-disable-next-line max-len
      pemkey: '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE1Olb3zMAFFxXKHiIkQO5cJ3Yhl5i6UPp+IhuteBJbuHcA5UogKo0EWtlWwW6KSaKoTNEYL7JlCQiVnkhBktUgg==\n-----END PUBLIC KEY-----',
    }],
  })
  return t.rejects(
    f.manifest(),
    {
      code: 'EEXPIREDSIGNATUREKEY',
    }
  )
})

t.test('verifySignatures invalid signature', async t => {
  tnock(t, 'https://registry.npmjs.org')
    .get('/abbrev')
    .reply(200, {
      _id: 'abbrev',
      _rev: 'deadbeef',
      name: 'abbrev',
      'dist-tags': { latest: '1.1.1' },
      versions: {
        '1.1.1': {
          name: 'abbrev',
          version: '1.1.1',
          dist: {
            // eslint-disable-next-line max-len
            integrity: 'sha512-nne9/IiQ/hzIhY6pdDnbBtz7DjPTKrY00P/zvPSm5pOFkl6xuGrGnXn/VtTNNfNtAfZ9/1RtehkszU9qcTii0Q==',
            shasum: 'f8f2c887ad10bf67f634f005b6987fed3179aac8',
            tarball: 'https://registry.npmjs.org/abbrev/-/abbrev-1.1.1.tgz',
            signatures: [
              {
                keyid: 'SHA256:jl3bwswu80PjjokCgh0o2w5c2U4LhQAE57gj9cz1kzA',
                sig: 'nope',
              },
            ],
          },
        },
      },
    })

  const f = new RegistryFetcher('abbrev', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifySignatures: true,
    [`//registry.npmjs.org/:_keys`]: [{
      expires: null,
      keyid: 'SHA256:jl3bwswu80PjjokCgh0o2w5c2U4LhQAE57gj9cz1kzA',
      keytype: 'ecdsa-sha2-nistp256',
      scheme: 'ecdsa-sha2-nistp256',
      // eslint-disable-next-line max-len
      key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE1Olb3zMAFFxXKHiIkQO5cJ3Yhl5i6UPp+IhuteBJbuHcA5UogKo0EWtlWwW6KSaKoTNEYL7JlCQiVnkhBktUgg==',
      // eslint-disable-next-line max-len
      pemkey: '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE1Olb3zMAFFxXKHiIkQO5cJ3Yhl5i6UPp+IhuteBJbuHcA5UogKo0EWtlWwW6KSaKoTNEYL7JlCQiVnkhBktUgg==\n-----END PUBLIC KEY-----',
    }],
  })
  return t.rejects(
    /abbrev@1\.1\.1 has an invalid registry signature/,
    f.manifest(),
    {
      code: 'EINTEGRITYSIGNATURE',
      keyid: 'SHA256:jl3bwswu80PjjokCgh0o2w5c2U4LhQAE57gj9cz1kzA',
      signature: 'nope',
      resolved: 'https://registry.npmjs.org/abbrev/-/abbrev-1.1.1.tgz',
      // eslint-disable-next-line max-len
      integrity: 'sha512-nne9/IiQ/hzIhY6pdDnbBtz7DjPTKrY00P/zvPSm5pOFkl6xuGrGnXn/VtTNNfNtAfZ9/1RtehkszU9qcTii0Q==',
    }
  )
})

t.test('verifySignatures no valid key', async t => {
  const f = new RegistryFetcher('@isaacs/namespace-test', {
    registry,
    cache,
    verifySignatures: true,
    [`//localhost:${port}/:_keys`]: [{
      keyid: 'someotherid',
    }],
  })
  return t.rejects(
    f.manifest(),
    /@isaacs\/namespace-test@1\.0\.0 has a registry signature/,
    {
      code: 'EMISSINGSIGNATUREKEY',
    }
  )
})

t.test('verifySignatures no registry keys at all', async t => {
  const f = new RegistryFetcher('@isaacs/namespace-test', {
    registry,
    cache,
    verifySignatures: true,
    [`//localhost:${port}/:_keys`]: null,
  })
  return t.rejects(
    f.manifest(),
    /@isaacs\/namespace-test@1\.0\.0 has a registry signature/,
    {
      code: 'EMISSINGSIGNATUREKEY',
    }
  )
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
  server.listen(port + 1000, async () => {
    const f = new RegistryFetcher('no-tarball', {
      registry: `http://localhost:${port + 1000}`,
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

t.test('option replaceRegistryHost', rhTest => {
  const { join, resolve } = require('path')
  const fs = require('fs')

  const abbrev = resolve(__dirname, 'fixtures/abbrev-1.1.1.tgz')
  const abbrevTGZ = fs.readFileSync(abbrev)

  const abbrevPackument = JSON.stringify({
    _id: 'abbrev',
    _rev: 'lkjadflkjasdf',
    name: 'abbrev',
    'dist-tags': { latest: '1.1.1' },
    versions: {
      '1.1.1': {
        name: 'abbrev',
        version: '1.1.1',
        dist: {
          tarball: 'https://registry.npmjs.org/abbrev/-/abbrev-1.1.1.tgz',
        },
      },
    },
  })

  rhTest.test('host should not be replaced', async ct => {
    const testdir = t.testdir()
    tnock(ct, 'https://registry.github.com')
      .get('/abbrev')
      .reply(200, abbrevPackument)

    tnock(ct, 'https://registry.npmjs.org')
      .get('/abbrev/-/abbrev-1.1.1.tgz')
      .reply(200, abbrevTGZ)

    const fetcher = new RegistryFetcher('abbrev', {
      registry: 'https://registry.github.com',
      cache: join(testdir, 'cache'),
      fullReadJson: true,
      replaceRegistryHost: 'never',
    })
    ct.equal(fetcher.replaceRegistryHost, 'never')
    const manifest = await fetcher.manifest()
    ct.equal(manifest.dist.tarball, 'https://registry.npmjs.org/abbrev/-/abbrev-1.1.1.tgz')
    const tarball = await fetcher.tarball()
    ct.match(tarball, abbrevTGZ)
  })

  rhTest.test('host should be replaced', async ct => {
    const testdir = t.testdir()
    tnock(ct, 'https://registry.github.com')
      .get('/abbrev')
      .reply(200, abbrevPackument)
      .get('/abbrev/-/abbrev-1.1.1.tgz')
      .reply(200, abbrevTGZ)

    const fetcher = new RegistryFetcher('abbrev', {
      registry: 'https://registry.github.com',
      cache: join(testdir, 'cache'),
      fullReadJson: true,
    })
    ct.equal(fetcher.replaceRegistryHost, 'npmjs')
    const manifest = await fetcher.manifest()
    ct.equal(manifest.dist.tarball, 'https://registry.npmjs.org/abbrev/-/abbrev-1.1.1.tgz')
    const tarball = await fetcher.tarball()
    ct.match(tarball, abbrevTGZ)
  })

  rhTest.test('host should be replaced if set to npmjs', async ct => {
    const testdir = t.testdir()
    tnock(ct, 'https://registry.github.com')
      .get('/abbrev')
      .reply(200, abbrevPackument)
      .get('/abbrev/-/abbrev-1.1.1.tgz')
      .reply(200, abbrevTGZ)

    const fetcher = new RegistryFetcher('abbrev', {
      registry: 'https://registry.github.com',
      cache: join(testdir, 'cache'),
      fullReadJson: true,
      replaceRegistryHost: 'npmjs',
    })
    ct.equal(fetcher.replaceRegistryHost, 'npmjs')
    const manifest = await fetcher.manifest()
    ct.equal(manifest.dist.tarball, 'https://registry.npmjs.org/abbrev/-/abbrev-1.1.1.tgz')
    const tarball = await fetcher.tarball()
    ct.match(tarball, abbrevTGZ)
  })

  rhTest.end()
})
