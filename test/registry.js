const t = require('tap')
const path = require('node:path')
const fs = require('node:fs')
const mr = require('npm-registry-mock')
const tnock = require('./fixtures/tnock')
// Stub out sigstore verification for testing to avoid needing to refresh the tuf cache
const RegistryFetcher = require('../lib/registry.js')

const MockedRegistryFetcher = t.mock('../lib/registry.js', {
  sigstore: {
    verify: async (bundle, options) => {
      options.keySelector && options.keySelector()
      if (bundle.dsseEnvelope.payloadType === 'tlog-entry-mismatch') {
        throw new Error('bundle content and tlog entry do not match')
      }
      if (bundle.dsseEnvelope.signatures[0].sig === 'invalid-signature') {
        throw new Error('artifact signature verification failed')
      }
    },
  },
})

const port = 18000 + (+process.env.TAP_CHILD_ID || 0)
const me = t.testdir()
const registry = `http://localhost:${port}/`
const cache = me + '/cache'

let mockServer
t.before(() => {
  return new Promise((resolve, reject) => {
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
    }, (err, s) => {
      if (err) {
        return reject(err)
      }
      mockServer = s
      resolve()
    })
  })
})

t.teardown(() => {
  mockServer?.close()
})

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
      from: 'underscore@*',
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
      from: '@isaacs/namespace-test@*',
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
    integrity: 'sha1-1111111111111111111111111111111111111111',
  })
  return f.manifest().then(mani =>
    t.equal(
      mani._integrity,
      'sha1-1111111111111111111111111111111111111111 sha512-5ZYe1LgwHIaag0p9loMwsf5N/wJ4XAuHVNhSO+qulQOXWnyJVuco6IZjo+5u4ZLF/GimdHJcX+QK892ONfOCqQ=='
    ))
})

t.test('provide matching integrity, totes ok, includes signature', async t => {
  const f = new RegistryFetcher('@isaacs/namespace-test', {
    registry,
    cache,
    // eslint-disable-next-line max-len
    integrity: 'sha512-5ZYe1LgwHIaag0p9loMwsf5N/wJ4XAuHVNhSO+qulQOXWnyJVuco6IZjo+5u4ZLF/GimdHJcX+QK892ONfOCqQ==',
  })
  const mani = await f.manifest()
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
  const mani = await f.manifest()
  t.ok(mani._signatures)
  t.ok(mani._integrity)
})

t.test('verifySignatures expired key', async t => {
  const f = new RegistryFetcher('@isaacs/namespace-test', {
    registry,
    cache,
    verifySignatures: true,
    [`//localhost:${port}/:_keys`]: [{
      expires: '2010-01-01T00:00:00.000Z',
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

t.test('verifySignatures rotated keys', async t => {
  const f = new RegistryFetcher('@isaacs/namespace-test', {
    registry,
    cache,
    verifySignatures: true,
    [`//localhost:${port}/:_keys`]: [{
      expires: '2020-06-28T18:46:27.981Z', // Expired AFTER publish time: 2019-06-28T18:46:27.981Z
      keyid: 'SHA256:jl3bwswu80PjjokCgh0o2w5c2U4LhQAE57gj9cz1kzA',
      keytype: 'ecdsa-sha2-nistp256',
      scheme: 'ecdsa-sha2-nistp256',
      // eslint-disable-next-line max-len
      key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE1Olb3zMAFFxXKHiIkQO5cJ3Yhl5i6UPp+IhuteBJbuHcA5UogKo0EWtlWwW6KSaKoTNEYL7JlCQiVnkhBktUgg==',
      // eslint-disable-next-line max-len
      pemkey: '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE1Olb3zMAFFxXKHiIkQO5cJ3Yhl5i6UPp+IhuteBJbuHcA5UogKo0EWtlWwW6KSaKoTNEYL7JlCQiVnkhBktUgg==\n-----END PUBLIC KEY-----',
    }, {
      expires: null,
      keyid: 'SHA256:123',
      keytype: 'ecdsa-sha2-nistp256',
      scheme: 'ecdsa-sha2-nistp256',
      // eslint-disable-next-line max-len
      key: '123',
      // eslint-disable-next-line max-len
      pemkey: '-----BEGIN PUBLIC KEY-----\n123\n-----END PUBLIC KEY-----',
    }],
  })
  const mani = await f.manifest()
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

t.test('verifyAttestations valid attestations', async t => {
  tnock(t, 'https://registry.npmjs.org')
    .get('/sigstore')
    .reply(200, {
      _id: 'sigstore',
      _rev: 'deadbeef',
      name: 'sigstore',
      'dist-tags': { latest: '0.4.0' },
      versions: {
        '0.4.0': {
          name: 'sigstore',
          version: '0.4.0',
          dist: {
            // eslint-disable-next-line max-len
            integrity: 'sha512-KCwMX6k20mQyFkNYG2XT3lwK9u1P36wS9YURFd85zCXPrwrSLZCEh7/vMBFNYcJXRiBtGDS+T4/RZZF493zABA==',
            // eslint-disable-next-line max-len
            attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/sigstore@0.4.0', provenance: { predicateType: 'https://slsa.dev/provenance/v0.2' } },
          },
        },
      },
    })

  const fixture = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'sigstore/valid-attestations.json'),
    'utf8'
  )

  tnock(t, 'https://registry.npmjs.org')
    .get('/-/npm/v1/attestations/sigstore@0.4.0')
    .reply(200, JSON.parse(fixture))

  const f = new MockedRegistryFetcher('sigstore@0.4.0', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifyAttestations: true,
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

  const mani = await f.manifest()
  t.ok(mani._attestations)
  t.ok(mani._integrity)
})

t.test('verifyAttestations when registry returns no attestations', async t => {
  tnock(t, 'https://registry.npmjs.org')
    .get('/sigstore')
    .reply(200, {
      _id: 'sigstore',
      _rev: 'deadbeef',
      name: 'sigstore',
      'dist-tags': { latest: '0.4.0' },
      versions: {
        '0.4.0': {
          name: 'sigstore',
          version: '0.4.0',
          dist: {
            // eslint-disable-next-line max-len
            integrity: 'sha512-KCwMX6k20mQyFkNYG2XT3lwK9u1P36wS9YURFd85zCXPrwrSLZCEh7/vMBFNYcJXRiBtGDS+T4/RZZF493zABA==',
            // eslint-disable-next-line max-len
            attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/sigstore@0.4.0', provenance: { predicateType: 'https://slsa.dev/provenance/v0.2' } },
          },
        },
      },
    })

  tnock(t, 'https://registry.npmjs.org')
    .get('/-/npm/v1/attestations/sigstore@0.4.0')
    .reply(404)

  const f = new MockedRegistryFetcher('sigstore@0.4.0', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifyAttestations: true,
  })

  return t.rejects(
    f.manifest(),
    /404 Not Found - GET https:\/\/registry.npmjs.org\/-\/npm\/v1\/attestations\/sigstore@0\.4\.0/,
    {
      code: 'E404',
    }
  )
})

t.test('verifyAttestations when package has no attestations', async t => {
  tnock(t, 'https://registry.npmjs.org')
    .get('/sigstore')
    .reply(200, {
      _id: 'sigstore',
      _rev: 'deadbeef',
      name: 'sigstore',
      'dist-tags': { latest: '0.4.0' },
      versions: {
        '0.4.0': {
          name: 'sigstore',
          version: '0.4.0',
          dist: {
            // eslint-disable-next-line max-len
            integrity: 'sha512-KCwMX6k20mQyFkNYG2XT3lwK9u1P36wS9YURFd85zCXPrwrSLZCEh7/vMBFNYcJXRiBtGDS+T4/RZZF493zABA==',
          },
        },
      },
    })

  const f = new MockedRegistryFetcher('sigstore@0.4.0', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifyAttestations: true,
  })

  const mani = await f.manifest()
  t.ok(mani._integrity)
})

t.test('disable verifyAttestations when package has attestations', async t => {
  tnock(t, 'https://registry.npmjs.org')
    .get('/sigstore')
    .reply(200, {
      _id: 'sigstore',
      _rev: 'deadbeef',
      name: 'sigstore',
      'dist-tags': { latest: '0.4.0' },
      versions: {
        '0.4.0': {
          name: 'sigstore',
          version: '0.4.0',
          dist: {
            // eslint-disable-next-line max-len
            integrity: 'sha512-KCwMX6k20mQyFkNYG2XT3lwK9u1P36wS9YURFd85zCXPrwrSLZCEh7/vMBFNYcJXRiBtGDS+T4/RZZF493zABA==',
            // eslint-disable-next-line max-len
            attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/sigstore@0.4.0', provenance: { predicateType: 'https://slsa.dev/provenance/v0.2' } },
          },
        },
      },
    })

  const f = new MockedRegistryFetcher('sigstore@0.4.0', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifyAttestations: false,
  })

  const mani = await f.manifest()
  t.ok(mani._attestations)
  t.ok(mani._integrity)
})

t.test('verifyAttestations invalid signature', async t => {
  tnock(t, 'https://registry.npmjs.org')
    .get('/sigstore')
    .reply(200, {
      _id: 'sigstore',
      _rev: 'deadbeef',
      name: 'sigstore',
      'dist-tags': { latest: '0.4.0' },
      versions: {
        '0.4.0': {
          name: 'sigstore',
          version: '0.4.0',
          dist: {
            // eslint-disable-next-line max-len
            integrity: 'sha512-KCwMX6k20mQyFkNYG2XT3lwK9u1P36wS9YURFd85zCXPrwrSLZCEh7/vMBFNYcJXRiBtGDS+T4/RZZF493zABA==',
            // eslint-disable-next-line max-len
            attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/sigstore@0.4.0', provenance: { predicateType: 'https://slsa.dev/provenance/v0.2' } },
          },
        },
      },
    })

  const fixture = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'sigstore/invalid-attestations.json'),
    'utf8'
  )

  tnock(t, 'https://registry.npmjs.org')
    .get('/-/npm/v1/attestations/sigstore@0.4.0')
    .reply(200, JSON.parse(fixture))

  const f = new MockedRegistryFetcher('sigstore@0.4.0', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifyAttestations: true,
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
    f.manifest(),
    /sigstore@0\.4\.0 failed to verify attestation: artifact signature verification failed/,
    {
      code: 'EATTESTATIONVERIFY',
    }
  )
})

t.test('verifyAttestations publish attestation for unknown public key', async t => {
  tnock(t, 'https://registry.npmjs.org')
    .get('/sigstore')
    .reply(200, {
      _id: 'sigstore',
      _rev: 'deadbeef',
      name: 'sigstore',
      'dist-tags': { latest: '0.4.0' },
      versions: {
        '0.4.0': {
          name: 'sigstore',
          version: '0.4.0',
          dist: {
            // eslint-disable-next-line max-len
            integrity: 'sha512-KCwMX6k20mQyFkNYG2XT3lwK9u1P36wS9YURFd85zCXPrwrSLZCEh7/vMBFNYcJXRiBtGDS+T4/RZZF493zABA==',
            // eslint-disable-next-line max-len
            attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/sigstore@0.4.0', provenance: { predicateType: 'https://slsa.dev/provenance/v0.2' } },
          },
        },
      },
    })

  const fixture = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'sigstore/valid-attestations.json'),
    'utf8'
  )

  tnock(t, 'https://registry.npmjs.org')
    .get('/-/npm/v1/attestations/sigstore@0.4.0')
    .reply(200, JSON.parse(fixture))

  const f = new MockedRegistryFetcher('sigstore@0.4.0', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifyAttestations: true,
    [`//registry.npmjs.org/:_keys`]: [{
      expires: null,
      keyid: 'SHA256:JXkT/aBM9baLZ7dpjJLQhJrj3Ru5s/OSXoZzZsPUyhg',
      keytype: 'ecdsa-sha2-nistp256',
      scheme: 'ecdsa-sha2-nistp256',
      // eslint-disable-next-line max-len
      key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEztMhKw7mGA6DV6Cc510h10d/KFISm3fIue5AoZiKjh+noDv0bxxzr780F/tkqqw80+hSnJXKj7DuUyRD0IZH3A==',
      // eslint-disable-next-line max-len
      pemkey: '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEztMhKw7mGA6DV6Cc510h10d/KFISm3fIue5AoZiKjh+noDv0bxxzr780F/tkqqw80+hSnJXKj7DuUyRD0IZH3A==\n-----END PUBLIC KEY-----',
    }],
  })

  return t.rejects(
    f.manifest(),
    // eslint-disable-next-line max-len
    /sigstore@0\.4\.0 has attestations but no corresponding public key\(s\) can be found/,
    {
      code: 'EMISSINGSIGNATUREKEY',
    }
  )
})

t.test('verifyAttestations no attestation with keyid', async t => {
  tnock(t, 'https://registry.npmjs.org')
    .get('/sigstore')
    .reply(200, {
      _id: 'sigstore',
      _rev: 'deadbeef',
      name: 'sigstore',
      'dist-tags': { latest: '0.4.0' },
      versions: {
        '0.4.0': {
          name: 'sigstore',
          version: '0.4.0',
          dist: {
            // eslint-disable-next-line max-len
            integrity: 'sha512-KCwMX6k20mQyFkNYG2XT3lwK9u1P36wS9YURFd85zCXPrwrSLZCEh7/vMBFNYcJXRiBtGDS+T4/RZZF493zABA==',
            // eslint-disable-next-line max-len
            attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/sigstore@0.4.0', provenance: { predicateType: 'https://slsa.dev/provenance/v0.2' } },
          },
        },
      },
    })

  const fixture = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'sigstore/no-keyid-attestations.json'),
    'utf8'
  )

  tnock(t, 'https://registry.npmjs.org')
    .get('/-/npm/v1/attestations/sigstore@0.4.0')
    .reply(200, JSON.parse(fixture))

  const f = new MockedRegistryFetcher('sigstore@0.4.0', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifyAttestations: true,
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

  // Keyless attestations (no keyid) should not require registry keys
  const mani = await f.manifest()
  t.ok(mani._attestations)
  t.ok(mani._integrity)
})

t.test('verifyAttestations keyless without registry keys', async t => {
  tnock(t, 'https://registry.npmjs.org')
    .get('/sigstore')
    .reply(200, {
      _id: 'sigstore',
      _rev: 'deadbeef',
      name: 'sigstore',
      'dist-tags': { latest: '0.4.0' },
      versions: {
        '0.4.0': {
          name: 'sigstore',
          version: '0.4.0',
          dist: {
            // eslint-disable-next-line max-len
            integrity: 'sha512-KCwMX6k20mQyFkNYG2XT3lwK9u1P36wS9YURFd85zCXPrwrSLZCEh7/vMBFNYcJXRiBtGDS+T4/RZZF493zABA==',
            // eslint-disable-next-line max-len
            attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/sigstore@0.4.0', provenance: { predicateType: 'https://slsa.dev/provenance/v0.2' } },
          },
        },
      },
    })

  const fixture = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'sigstore/no-keyid-attestations.json'),
    'utf8'
  )

  tnock(t, 'https://registry.npmjs.org')
    .get('/-/npm/v1/attestations/sigstore@0.4.0')
    .reply(200, JSON.parse(fixture))

  // Keyless (Sigstore/Fulcio) attestations embed the signing certificate
  // in the bundle and should verify without any registry keys at all
  const f = new MockedRegistryFetcher('sigstore@0.4.0', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifyAttestations: true,
  })

  const mani = await f.manifest()
  t.ok(mani._attestations)
  t.ok(mani._integrity)
})

t.test('verifyAttestations valid attestations', async t => {
  tnock(t, 'https://registry.npmjs.org')
    .get('/sigstore')
    .reply(200, {
      _id: 'sigstore',
      _rev: 'deadbeef',
      name: 'sigstore',
      'dist-tags': { latest: '0.4.0' },
      versions: {
        '0.4.0': {
          name: 'sigstore',
          version: '0.4.0',
          dist: {
            // eslint-disable-next-line max-len
            integrity: 'sha512-KCwMX6k20mQyFkNYG2XT3lwK9u1P36wS9YURFd85zCXPrwrSLZCEh7/vMBFNYcJXRiBtGDS+T4/RZZF493zABA==',
            // eslint-disable-next-line max-len
            attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/sigstore@0.4.0', provenance: { predicateType: 'https://slsa.dev/provenance/v0.2' } },
          },
        },
      },
    })

  const fixture = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'sigstore/mismatched-keyid-attestations.json'),
    'utf8'
  )

  tnock(t, 'https://registry.npmjs.org')
    .get('/-/npm/v1/attestations/sigstore@0.4.0')
    .reply(200, JSON.parse(fixture))

  const f = new MockedRegistryFetcher('sigstore@0.4.0', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifyAttestations: true,
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
    f.manifest(),
    // eslint-disable-next-line max-len
    /sigstore@0\.4\.0 has attestations with keyid: JXkT\/aBM9baLZ7dpjJLQhJrj3Ru5s\/OSXoZzZsPUyhg but no corresponding public key can be found/,
    {
      code: 'EMISSINGSIGNATUREKEY',
    }
  )
})

t.test('verifyAttestations no matching registry keys', async t => {
  tnock(t, 'https://registry.npmjs.org')
    .get('/sigstore')
    .reply(200, {
      _id: 'sigstore',
      _rev: 'deadbeef',
      name: 'sigstore',
      'dist-tags': { latest: '0.4.0' },
      versions: {
        '0.4.0': {
          name: 'sigstore',
          version: '0.4.0',
          dist: {
            // eslint-disable-next-line max-len
            integrity: 'sha512-KCwMX6k20mQyFkNYG2XT3lwK9u1P36wS9YURFd85zCXPrwrSLZCEh7/vMBFNYcJXRiBtGDS+T4/RZZF493zABA==',
            // eslint-disable-next-line max-len
            attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/sigstore@0.4.0', provenance: { predicateType: 'https://slsa.dev/provenance/v0.2' } },
          },
        },
      },
    })

  const fixture = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'sigstore/valid-attestations.json'),
    'utf8'
  )

  tnock(t, 'https://registry.npmjs.org')
    .get('/-/npm/v1/attestations/sigstore@0.4.0')
    .reply(200, JSON.parse(fixture))

  const f = new MockedRegistryFetcher('sigstore@0.4.0', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifyAttestations: true,
    [`//registry.npmjs.org/:_keys`]: [{
      expires: null,
      keyid: 'SHA256:JXkT/aBM9baLZ7dpjJLQhJrj3Ru5s/OSXoZzZsPUyhg',
      keytype: 'ecdsa-sha2-nistp256',
      scheme: 'ecdsa-sha2-nistp256',
      // eslint-disable-next-line max-len
      key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEztMhKw7mGA6DV6Cc510h10d/KFISm3fIue5AoZiKjh+noDv0bxxzr780F/tkqqw80+hSnJXKj7DuUyRD0IZH3A==',
      // eslint-disable-next-line max-len
      pemkey: '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEztMhKw7mGA6DV6Cc510h10d/KFISm3fIue5AoZiKjh+noDv0bxxzr780F/tkqqw80+hSnJXKj7DuUyRD0IZH3A==\n-----END PUBLIC KEY-----',
    }],
  })

  return t.rejects(
    f.manifest(),
    // eslint-disable-next-line max-len
    /sigstore@0\.4\.0 has attestations but no corresponding public key\(s\) can be found/,
    {
      code: 'EMISSINGSIGNATUREKEY',
    }
  )
})

t.test('verifyAttestations no valid key', async t => {
  const fixture = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'sigstore/valid-attestations.json'),
    'utf8'
  )

  tnock(t, 'https://registry.npmjs.org')
    .get('/-/npm/v1/attestations/sigstore@0.4.0')
    .reply(200, JSON.parse(fixture))

  const f = new MockedRegistryFetcher('sigstore@0.4.0', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifyAttestations: true,
    [`//registry.npmjs.org/:_keys`]: [{
      expires: '2010-01-01T00:00:00.000Z',
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
    // eslint-disable-next-line max-len
    /sigstore@0\.4\.0 has attestations with keyid: SHA256:jl3bwswu80PjjokCgh0o2w5c2U4LhQAE57gj9cz1kzA but the corresponding public key has expired 2010-01-01T00:00:00\.000Z/,
    {
      code: 'EEXPIREDSIGNATUREKEY',
    }
  )
})

t.test('verifyAttestations rotated key', async t => {
  const fixture = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'sigstore/valid-attestations.json'),
    'utf8'
  )

  tnock(t, 'https://registry.npmjs.org')
    .get('/-/npm/v1/attestations/sigstore@0.4.0')
    .reply(200, JSON.parse(fixture))

  const f = new MockedRegistryFetcher('sigstore@0.4.0', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifyAttestations: true,
    [`//registry.npmjs.org/:_keys`]: [{
      expires: '2023-04-01T00:00:00.000Z', // Rotated AFTER integratedTime 2023-01-11T17:31:54.000Z
      keyid: 'SHA256:jl3bwswu80PjjokCgh0o2w5c2U4LhQAE57gj9cz1kzA',
      keytype: 'ecdsa-sha2-nistp256',
      scheme: 'ecdsa-sha2-nistp256',
      // eslint-disable-next-line max-len
      key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE1Olb3zMAFFxXKHiIkQO5cJ3Yhl5i6UPp+IhuteBJbuHcA5UogKo0EWtlWwW6KSaKoTNEYL7JlCQiVnkhBktUgg==',
      // eslint-disable-next-line max-len
      pemkey: '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE1Olb3zMAFFxXKHiIkQO5cJ3Yhl5i6UPp+IhuteBJbuHcA5UogKo0EWtlWwW6KSaKoTNEYL7JlCQiVnkhBktUgg==\n-----END PUBLIC KEY-----',
    }],
  })

  const mani = await f.manifest()
  t.ok(mani._attestations)
  t.ok(mani._integrity)
})

t.test('verifyAttestations no registry keys at all', async t => {
  tnock(t, 'https://registry.npmjs.org')
    .get('/sigstore')
    .reply(200, {
      _id: 'sigstore',
      _rev: 'deadbeef',
      name: 'sigstore',
      'dist-tags': { latest: '0.4.0' },
      versions: {
        '0.4.0': {
          name: 'sigstore',
          version: '0.4.0',
          dist: {
            // eslint-disable-next-line max-len
            integrity: 'sha512-KCwMX6k20mQyFkNYG2XT3lwK9u1P36wS9YURFd85zCXPrwrSLZCEh7/vMBFNYcJXRiBtGDS+T4/RZZF493zABA==',
            // eslint-disable-next-line max-len
            attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/sigstore@0.4.0', provenance: { predicateType: 'https://slsa.dev/provenance/v0.2' } },
          },
        },
      },
    })

  const fixture = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'sigstore/valid-attestations.json'),
    'utf8'
  )

  tnock(t, 'https://registry.npmjs.org')
    .get('/-/npm/v1/attestations/sigstore@0.4.0')
    .reply(200, JSON.parse(fixture))

  const f = new MockedRegistryFetcher('sigstore@0.4.0', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifyAttestations: true,
  })

  return t.rejects(
    f.manifest(),
    // eslint-disable-next-line max-len
    /sigstore@0\.4\.0 has attestations but no corresponding public key\(s\) can be found/,
    {
      code: 'EMISSINGSIGNATUREKEY',
    }
  )
})

t.test('verifyAttestations fetching without version', async t => {
  tnock(t, 'https://registry.npmjs.org')
    .get('/sigstore')
    .reply(200, {
      _id: 'sigstore',
      _rev: 'deadbeef',
      name: 'sigstore',
      'dist-tags': { latest: '0.4.0' },
      versions: {
        '0.4.0': {
          name: 'sigstore',
          version: '0.4.0',
          dist: {
            // eslint-disable-next-line max-len
            integrity: 'sha512-KCwMX6k20mQyFkNYG2XT3lwK9u1P36wS9YURFd85zCXPrwrSLZCEh7/vMBFNYcJXRiBtGDS+T4/RZZF493zABA==',
            // eslint-disable-next-line max-len
            attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/sigstore@0.4.0', provenance: { predicateType: 'https://slsa.dev/provenance/v0.2' } },
          },
        },
      },
    })

  const fixture = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'sigstore/valid-attestations.json'),
    'utf8'
  )

  tnock(t, 'https://registry.npmjs.org')
    .get('/-/npm/v1/attestations/sigstore@0.4.0')
    .reply(200, JSON.parse(fixture))

  const f = new MockedRegistryFetcher('sigstore', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifyAttestations: true,
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
    f.manifest(),
    // eslint-disable-next-line max-len
    /sigstore@0\.4\.0 package name and version \(PURL\): sigstore@\* doesn't match what was signed: pkg:npm\/sigstore@0\.4\.0/,
    {
      code: 'EMISSINGSIGNATUREKEY',
    }
  )
})

t.test('verifyAttestations mismatched subject name', async t => {
  tnock(t, 'https://registry.npmjs.org')
    .get('/sigstore')
    .reply(200, {
      _id: 'sigstore',
      _rev: 'deadbeef',
      name: 'sigstore',
      'dist-tags': { latest: '0.4.0' },
      versions: {
        '0.4.0': {
          name: 'sigstore',
          version: '0.4.0',
          dist: {
            // eslint-disable-next-line max-len
            integrity: 'sha512-KCwMX6k20mQyFkNYG2XT3lwK9u1P36wS9YURFd85zCXPrwrSLZCEh7/vMBFNYcJXRiBtGDS+T4/RZZF493zABA==',
            // eslint-disable-next-line max-len
            attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/sigstore@0.4.0', provenance: { predicateType: 'https://slsa.dev/provenance/v0.2' } },
          },
        },
      },
    })

  const fixture = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'sigstore/mismatched-subject-name-attestations.json'),
    'utf8'
  )

  tnock(t, 'https://registry.npmjs.org')
    .get('/-/npm/v1/attestations/sigstore@0.4.0')
    .reply(200, JSON.parse(fixture))

  const f = new MockedRegistryFetcher('sigstore@0.4.0', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifyAttestations: true,
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
    f.manifest(),
    // eslint-disable-next-line max-len
    /sigstore@0\.4\.0 package name and version \(PURL\): pkg:npm\/sigstore@0\.4\.0 doesn't match what was signed: pkg:npm\/sigstore@1\.4\.0/,
    {
      code: 'EATTESTATIONSUBJECT',
    }
  )
})

t.test('verifyAttestations mismatched subject sha512 digest', async t => {
  tnock(t, 'https://registry.npmjs.org')
    .get('/sigstore')
    .reply(200, {
      _id: 'sigstore',
      _rev: 'deadbeef',
      name: 'sigstore',
      'dist-tags': { latest: '0.4.0' },
      versions: {
        '0.4.0': {
          name: 'sigstore',
          version: '0.4.0',
          dist: {
            // eslint-disable-next-line max-len
            integrity: 'sha512-KCwMX6k20mQyFkNYG2XT3lwK9u1P36wS9YURFd85zCXPrwrSLZCEh7/vMBFNYcJXRiBtGDS+T4/RZZF493zABA==',
            // eslint-disable-next-line max-len
            attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/sigstore@0.4.0', provenance: { predicateType: 'https://slsa.dev/provenance/v0.2' } },
          },
        },
      },
    })

  const fixture = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'sigstore/mismatched-subject-digest-attestations.json'),
    'utf8'
  )

  tnock(t, 'https://registry.npmjs.org')
    .get('/-/npm/v1/attestations/sigstore@0.4.0')
    .reply(200, JSON.parse(fixture))

  const f = new MockedRegistryFetcher('sigstore@0.4.0', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifyAttestations: true,
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
    f.manifest(),
    // eslint-disable-next-line max-len
    /sigstore@0\.4\.0 package integrity \(hex digest\): 282c0c5fa936d264321643581b65d3de5c0af6ed4fdfac12f5851115df39cc25cfaf0ad22d908487bfef30114d61c25746206d1834be4f8fd1659178f77cc004 doesn't match what was signed: 123c0c5fa936d264321643581b65d3de5c0af6ed4fdfac12f5851115df39cc25cfaf0ad22d908487bfef30114d61c25746206d1834be4f8fd1659178f77cc004/,
    {
      code: 'EATTESTATIONSUBJECT',
    }
  )
})

t.test('verifyAttestations bundle payload that does not match the tlog entry', async t => {
  tnock(t, 'https://registry.npmjs.org')
    .get('/sigstore')
    .reply(200, {
      _id: 'sigstore',
      _rev: 'deadbeef',
      name: 'sigstore',
      'dist-tags': { latest: '0.4.0' },
      versions: {
        '0.4.0': {
          name: 'sigstore',
          version: '0.4.0',
          dist: {
            // eslint-disable-next-line max-len
            integrity: 'sha512-KCwMX6k20mQyFkNYG2XT3lwK9u1P36wS9YURFd85zCXPrwrSLZCEh7/vMBFNYcJXRiBtGDS+T4/RZZF493zABA==',
            // eslint-disable-next-line max-len
            attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/sigstore@0.4.0', provenance: { predicateType: 'https://slsa.dev/provenance/v0.2' } },
          },
        },
      },
    })

  const fixture = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'sigstore/unsupported-attestations.json'),
    'utf8'
  )

  tnock(t, 'https://registry.npmjs.org')
    .get('/-/npm/v1/attestations/sigstore@0.4.0')
    .reply(200, JSON.parse(fixture))

  const f = new MockedRegistryFetcher('sigstore@0.4.0', {
    registry: 'https://registry.npmjs.org',
    cache,
    verifyAttestations: true,
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
    f.manifest(),
    // eslint-disable-next-line max-len
    /sigstore@0\.4\.0 failed to verify attestation: bundle content and tlog entry do not match/,
    {
      code: 'EATTESTATIONVERIFY',
    }
  )
})

t.test('404 fails with E404', t => {
  const f = new RegistryFetcher('thing-is-not-here', { registry, cache })
  return t.rejects(f.resolve(), { code: 'E404' }).then(() =>
    t.equal(f.fullMetadata, true, 'tried again with got full metadata'))
})

t.test('respect default tag', async t => {
  const taggedPackument = JSON.stringify({
    _id: 'abbrev',
    _rev: 'lkjadflkjasdf',
    name: 'abbrev',
    'dist-tags': { latest: '1.1.1', stable: '1.1.0' },
    versions: {
      '1.1.0': {
        name: 'abbrev',
        version: '1.1.0',
        dist: {
          tarball: 'https://registry.npmjs.org/abbrev/-/abbrev-1.1.0.tgz',
        },
      },
      '1.1.1': {
        name: 'abbrev',
        version: '1.1.1',
        dist: {
          tarball: 'https://registry.npmjs.org/abbrev/-/abbrev-1.1.1.tgz',
        },
      },
    },
  })
  tnock(t, 'https://registry.github.com')
    .get('/abbrev')
    .reply(200, taggedPackument)

  const f = new RegistryFetcher('abbrev', {
    registry: 'https://registry.github.com',
    cache,
    defaultTag: 'stable',
  })
  t.equal(await f.resolve(), 'https://registry.npmjs.org/abbrev/-/abbrev-1.1.0.tgz')
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
    from: 'no-integrity@*',
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
  const packumentCache = new Map([[`corgi:${packumentUrl}`, packument]])
  const f = new RegistryFetcher('asdf@1.2', { registry, cache, packumentCache })
  t.equal(await f.packument(), packument, 'got cached packument')
})

t.test('corgi packument is not cached as full packument', async t => {
  const packumentUrl = `${registry}underscore`
  const packument = {
    name: 'underscore',
    versions: {
      '1.5.1': {
        cached: true,
        name: 'underscore',
        version: '1.5.1',
      },
    },
  }
  const packumentCache = new Map([[`corgi:${packumentUrl}`, packument]])
  const f = new RegistryFetcher('underscore', {
    packumentCache,
    registry,
    cache,
    fullMetadata: true,
  })
  t.not(await f.packument(), packument, 'did not get cached packument')
  t.ok(packumentCache.has(`full:${packumentUrl}`), 'full packument is also now cached')
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
        _test: true,
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
    ct.equal(manifest._test, true, 'Underscores are preserved')
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
    ct.equal(fetcher.replaceRegistryHost, 'registry.npmjs.org')
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
    ct.equal(fetcher.replaceRegistryHost, 'registry.npmjs.org')
    const manifest = await fetcher.manifest()
    ct.equal(manifest.dist.tarball, 'https://registry.npmjs.org/abbrev/-/abbrev-1.1.1.tgz')
    const tarball = await fetcher.tarball()
    ct.match(tarball, abbrevTGZ)
  })

  rhTest.end()
})

t.test('packument contentLength from registry', async t => {
  const f = new RegistryFetcher('underscore', { registry, cache })
  const p = await f.packument()
  t.equal(p._contentLength, undefined, 'content length is undefined from registry requests')
})
