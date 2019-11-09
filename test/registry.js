const RegistryFetcher = require('../lib/registry.js')
const t = require('tap')
const mr = require('npm-registry-mock')
const port = 18000 + (+process.env.TAP_CHILD_ID || 0)
const {resolve, basename} = require('path')
const me = t.testdir()

t.test('start mock registry', { bail: true }, t => {
  mr({
    port,
    mocks: {
      get: {
        '/no-integrity/-/no-integrity-1.2.3.tgz': [
          200,
          `${__dirname}/fixtures/abbrev-1.1.1.tgz`
        ]
      }
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
              tarball: `${registry}no-integrity/-/no-integrity-1.2.3.tgz`
            }
          },
        },
      })
    }
  }, (er, s) => {
    if (er)
      throw er

    t.parent.teardown(() => s.close())
    t.end()
  })
})

const registry = `http://localhost:${port}/`
const cache = me + '/cache'

t.test('underscore, no tag or version', t => {
  const f = new RegistryFetcher('underscore', {registry, cache})

  return f.resolve().then(r => t.equal(r, `${registry}underscore/-/underscore-1.5.1.tgz`))
  .then(() => f.manifest()).then(m => {
    t.equal(m, f.package)
    t.match(m, { version: '1.5.1' })
    return f.manifest().then(m2 => t.equal(m, m2, 'manifest cached'))
  })
  .then(() => f.extract(me + '/underscore'))
  .then(result => t.deepEqual(result, {
    resolved: `${registry}underscore/-/underscore-1.5.1.tgz`,
    integrity: 'sha1-0r3oF9F2/63olKtxRY5oKhS4bck= sha512-yOc7VukmA45a1D6clUn1mD7Mbc9LcVYAQEXNKSTblzha59hSFJ6cAt90JDoxh05GQnTPI9nk4wjT/I8C/nAMPw==',
    from: "underscore@",
  }))
})

t.test('scoped, no tag or version', t => {
  const f = new RegistryFetcher('@isaacs/namespace-test', {registry, cache})

  return f.resolve().then(r => t.equal(r, `${registry}@isaacs/namespace-test/-/namespace-test-1.0.0.tgz`))
  .then(() => f.manifest()).then(m => t.match(m, { version: '1.0.0' }))
  .then(() => f.extract(me + '/namespace-test'))
  .then(result => t.deepEqual(result, {
    resolved: `${registry}@isaacs/namespace-test/-/namespace-test-1.0.0.tgz`,
    integrity: 'sha512-5ZYe1LgwHIaag0p9loMwsf5N/wJ4XAuHVNhSO+qulQOXWnyJVuco6IZjo+5u4ZLF/GimdHJcX+QK892ONfOCqQ==',
    from: "@isaacs/namespace-test@",
  }))
})

t.test('provide invalid integrity, fails to unpack', async t => {
  const f = new RegistryFetcher('@isaacs/namespace-test', {
    registry,
    cache,
    integrity: 'sha512-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='
  })
  return t.rejects(f.extract(me + '/bad-integrity'), {
    code: 'EINTEGRITY',
  })
})

t.test('404 fails with E404', t => {
  const f = new RegistryFetcher('thing-is-not-here', {registry, cache})
  return t.rejects(f.resolve(), { code: 'E404' }).then(() =>
    t.equal(f.fullMetadata, true, 'tried again with got full metadata'))
})

t.test('respect default tag', async t => {
  const f = new RegistryFetcher('underscore', {registry, cache, tag: 'stable'})
  t.equal(f.spec.raw, 'underscore@stable')
  t.equal(await f.resolve(), `${registry}underscore/-/underscore-1.5.1.tgz`)
})

t.test('fail resolution if no dist.tarball', t => {
  const f = new RegistryFetcher('no-tarball', {registry, cache})
  return t.rejects(f.resolve(), {
    message: 'Invalid package manifest: no `dist.tarball` field',
    package: 'no-tarball',
  })
})

t.test('a manifest that lacks integrity', t => {
  const f = new RegistryFetcher('no-integrity', {registry, cache})
  return f.manifest().then(mani => {
    t.notOk(mani._integrity, 'should have no integrity')
    return f.extract(me + '/no-integrity')
  }).then(result => t.deepEqual(result, {
    resolved: `${registry}no-integrity/-/no-integrity-1.2.3.tgz`,
    integrity: 'sha512-nne9/IiQ/hzIhY6pdDnbBtz7DjPTKrY00P/zvPSm5pOFkl6xuGrGnXn/VtTNNfNtAfZ9/1RtehkszU9qcTii0Q==',
    from: "no-integrity@",
  }, 'calculated integrity anyway'))
})
