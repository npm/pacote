const Fetcher = require('../lib/fetcher.js')
const t = require('tap')
const npa = require('npm-package-arg')

t.test('various projectiles', t => {
  t.throws(() => new Fetcher(), { message: 'options object is required' })
  const f = new Fetcher('foo', {})
  // base class doesn't implement functionality
  const expect = {
    message: 'not implemented in this fetcher type: FetcherBase'
  }
  t.rejects(f.resolve(), expect)
  t.rejects(f.extract('target'), expect)
  t.rejects(f.manifest(), expect)
  t.rejects(f.packument(), expect)
  t.rejects(f.tarball(), expect)
  const foo = npa('foo@bar')
  foo.type = 'blerg'
  t.throws(() => Fetcher.get(foo, {}), {
    message: 'Unknown spec type: blerg'
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
