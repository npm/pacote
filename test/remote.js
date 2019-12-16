const RemoteFetcher = require('../lib/remote.js')
const http = require('http')
const t = require('tap')

const { relative, resolve } = require('path')
const me = t.testdir()
const cache = resolve(me, 'cache')

t.cleanSnapshot = str => str.split(''+port).join('{PORT}')

const fs = require('fs')
const abbrev = resolve(__dirname, 'fixtures/abbrev-1.1.1.tgz')
const abbrevspec = `file:${relative(process.cwd(), abbrev)}`
const abbrevMani = require('./fixtures/abbrev-manifest-min.json')
const port = 12345 + (+process.env.TAP_CHILD_ID || 0)
const server = `http://localhost:${port}`
const requestLog = []
t.test('start server', t => {
  const data = fs.readFileSync(abbrev)
  const server = http.createServer((req, res) => {
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
      const data = Buffer.from('this is lovely data but not a tarball')
      res.setHeader('content-length', data.length + 2048)
      res.write(data)
      res.end(Buffer.alloc(2048))
    } else if (req.url === '/timeout') {
      res.statusCode = 200
      res.write('just a second... ')
      setTimeout(() => res.end('still there?'), 10000).unref()
    } else {
      res.setHeader('content-type', 'application/octet-stream')
      res.setHeader('content-length', data.length)
      res.end(data)
    }
  })
  server.listen(port, () => {
    t.parent.teardown(() => server.close())
    t.end()
  })
})

t.test('packument', t => {
  //const url = 'https://registry.npmjs.org/abbrev/-/abbrev-1.1.1.tgz'
  const url = `${server}/abbrev.tgz`
  const f = new RemoteFetcher(url, { cache })
  // run twice to pull from cache the second time
  return t.resolveMatchSnapshot(f.packument(), 'packument')
    .then(() => {
      const f2 = new RemoteFetcher(`abbrev@${url}`, {
        cache,
        pkgid: `remote:abbrev@${url}`,
        preferOffline: true,
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
            'npm-scope': 'undefined',
            'npm-session': 'undefined',
            referer: 'undefined',
            'pacote-version': version,
            'pacote-req-type': 'tarball',
            'pacote-pkg-id': `remote:${server}/abbrev.tgz`,
            accept: '*/*',
            'accept-encoding': 'gzip,deflate',
            host: require('url').parse(server).host,
          }
        ]
      ])
      requestLog.length = 0
    })
})

t.test('bad integrity', t => {
  const url = `${server}/abbrev.tgz`
  const integrity = 'sha512-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='
  const f = new RemoteFetcher(url, { cache, integrity })
  //return t.rejects(f.packument(), {
  return t.rejects(f.extract(me + '/bad-integrity'), {
    code: 'EINTEGRITY',
    sri: {
      sha512: [
        // create a buffer of nulls, the base64 is an endless scream
        { digest: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==' },
      ],
    },
  })
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
    message: `network timeout at: ${server}/timeout`,
  })
})
