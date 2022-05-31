const RemoteFetcher = require('../lib/remote.js')
const http = require('http')
const ssri = require('ssri')
const t = require('tap')

const { resolve } = require('path')
const me = t.testdir()
const cache = resolve(me, 'cache')

t.cleanSnapshot = str => str.split('' + port).join('{PORT}')

const fs = require('fs')
const abbrev = resolve(__dirname, 'fixtures/abbrev-1.1.1.tgz')
const port = 12345 + (+process.env.TAP_CHILD_ID || 0)
const server = `http://localhost:${port}`
let abbrevIntegrity
const requestLog = []
t.test('start server', t => {
  const data = fs.readFileSync(abbrev)
  abbrevIntegrity = ssri.fromData(data)
  const httpServer = http.createServer((req, res) => {
    res.setHeader('cache-control', 'max-age=432000')
    res.setHeader('accept-ranges', 'bytes')
    res.setHeader('etag', '"a2177e7d2ad8d263e6c38e6fe8dd6f79"')
    res.setHeader('last-modified', 'Sat, 26 May 2018 16:03:07 GMT')
    res.setHeader('vary', 'Accept-Encoding')
    res.setHeader('connection', 'close')
    requestLog.push([req.url, req.headers])
    if (req.url === '/404') {
      res.statusCode = 404
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ error: 'not found' }))
    } else if (req.url === '/not-tgz') {
      const nonTarData = Buffer.from('this is lovely data but not a tarball')
      res.setHeader('content-length', nonTarData.length + 2048)
      res.write(nonTarData)
      res.end(Buffer.alloc(2048))
    } else if (req.url === '/timeout') {
      res.statusCode = 200
      // your call is important to us
    } else {
      res.setHeader('content-type', 'application/octet-stream')
      res.setHeader('content-length', data.length)
      res.end(data)
    }
  })
  httpServer.listen(port, () => {
    t.parent.teardown(() => httpServer.close())
    t.end()
  })
})

t.test('packument', t => {
  // const url = 'https://registry.npmjs.org/abbrev/-/abbrev-1.1.1.tgz'
  const url = `https://registry.npmjs.org/abbrev.tgz`
  const f = new RemoteFetcher(url, {
    registry: server,
    cache,
    preferOffline: true,
    headers: {
      'not-referer': 'http://example.com',
    },
    scope: '@npmcli',
    npmSession: 'foobarbaz',
  })
  // run twice to pull from cache the second time
  return t.resolveMatchSnapshot(f.packument(), 'packument')
    .then(() => {
      const f2 = new RemoteFetcher(`abbrev@${url}`, {
        registry: server,
        pkgid: `remote:abbrev@${url}`,
        cache,
      })
      return t.resolveMatchSnapshot(f2.packument(), 'packument 2')
    })
    .then(() => {
      const version = require('../package.json').version
      t.equal(requestLog.length, 1, 'only one request hit the server')
      t.match(requestLog, [
        [
          '/abbrev.tgz',
          {
            connection: 'keep-alive',
            'user-agent': `pacote/${version} node/${process.version}`,
            'pacote-version': version,
            'pacote-req-type': 'tarball',
            'pacote-pkg-id': `remote:${server}/abbrev.tgz`,
            accept: '*/*',
            'accept-encoding': 'gzip,deflate',
            host: new URL(server).host,
            'npm-session': 'foobarbaz',
            'npm-scope': '@npmcli',
            'not-referer': 'http://example.com',
          },
        ],
      ])
      requestLog.length = 0
    })
})

t.test('bad integrity', t => {
  const url = `${server}/abbrev.tgz`
  // eslint-disable-next-line max-len
  const integrity = 'sha512-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='
  const f = new RemoteFetcher(url, { cache, integrity })
  return t.rejects(f.extract(me + '/bad-integrity'), {
    code: 'EINTEGRITY',
    sri: {
      sha512: [
        // create a buffer of nulls, the base64 is an endless scream
        // eslint-disable-next-line max-len
        { digest: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==' },
      ],
    },
  })
})

t.test('known integrity', async t => {
  const url = `${server}/abbrev.tgz`
  const f = new RemoteFetcher(url, { cache, integrity: abbrevIntegrity })
  await f.extract(me + '/good-integrity')
  t.same(f.integrity, abbrevIntegrity, 'got the right integrity back out')
})

t.test('an missing tarball', t => {
  const url = `${server}/404`
  const f = new RemoteFetcher(url, { cache })
  return t.rejects(f.extract(me + '/404'), {
    statusCode: 404,
    code: 'E404',
    body: { error: 'not found' },
    pkgid: `${server}/404`,
  })
})

t.test('not a tarball', t => {
  const url = `${server}/not-tgz`
  const f = new RemoteFetcher(url, { cache })
  return t.rejects(f.extract(me + '/not-tgz'), {
    code: 'TAR_BAD_ARCHIVE',
    message: 'Unrecognized archive format',
  })
})

t.test('get a timeout error from the http fetch', t => {
  const url = `${server}/timeout`
  const f = new RemoteFetcher(url, { cache: cache + '/fresh', timeout: 1 })
  return t.rejects(f.extract(me + '/timeout'), {
    name: 'FetchError',
    message: /timeout/,
    code: /FETCH_ERROR|ERR_SOCKET_TIMEOUT/,
  })
})

t.test('option replaceRegistryHost', rhTest => {
  const tnock = require('./fixtures/tnock')
  const { join } = require('path')
  const abbrevTGZ = fs.readFileSync(abbrev)

  rhTest.test('host should be replaced if set to always on npmjs registry', async ct => {
    const testdir = t.testdir()
    tnock(ct, 'https://registry.github.com')
      .get('/abbrev/-/abbrev-1.1.1.tgz')
      .reply(200, abbrevTGZ)

    const fetcher = new RemoteFetcher(
      'https://registry.npmjs.org/abbrev/-/abbrev-1.1.1.tgz',
      {
        registry: 'https://registry.github.com',
        cache: join(testdir, 'cache'),
        fullReadJson: true,
        replaceRegistryHost: 'always',
      })
    ct.equal(fetcher.replaceRegistryHost, 'always')
    const tarball = await fetcher.tarball()
    ct.match(tarball, abbrevTGZ)
  })

  rhTest.test('host should be replaced if set to always on other registry', async ct => {
    const testdir = t.testdir()
    tnock(ct, 'https://registry.github.com')
      .get('/abbrev/-/abbrev-1.1.1.tgz')
      .reply(200, abbrevTGZ)

    const fetcher = new RemoteFetcher(
      'https://registry.somethingelse.org/abbrev/-/abbrev-1.1.1.tgz',
      {
        registry: 'https://registry.github.com',
        cache: join(testdir, 'cache'),
        fullReadJson: true,
        replaceRegistryHost: 'always',
      })
    ct.equal(fetcher.replaceRegistryHost, 'always')
    const tarball = await fetcher.tarball()
    ct.match(tarball, abbrevTGZ)
  })

  rhTest.end()
})
