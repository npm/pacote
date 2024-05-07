const t = require('tap')
const fs = require('node:fs')
const { resolve, relative } = require('node:path')
const DirFetcher = require('../lib/dir.js')
const FileFetcher = require('../lib/file.js')
const GitFetcher = require('../lib/git.js')
const RegistryFetcher = require('../lib/registry.js')
const RemoteFetcher = require('../lib/remote.js')
const pacote = require('../lib/index.js')

const abbrev = resolve(__dirname, 'fixtures/abbrev-1.1.1.tgz')
const abbrevspec = `file:${relative(process.cwd(), abbrev)}`

const me = t.testdir()

t.cleanSnapshot = str => str
  .split(process.cwd()).join('${CWD}')
  .replace(/\\/g, '/')

// Putting all these tests inside a `t.test` suite broke the tests. They either
// didn't run or failed w/ no message.  Ignoring promise/catch-or-return for now.
t.resolveMatchSnapshot(pacote.resolve(abbrevspec), 'resolve')
t.resolveMatchSnapshot(pacote.extract(abbrevspec, me + '/extract'), 'extract')
t.resolveMatchSnapshot(pacote.manifest(abbrevspec), 'manifest')
t.resolveMatchSnapshot(pacote.packument(abbrevspec), 'packument')
t.resolveMatch(pacote.tarball(abbrevspec), fs.readFileSync(abbrev), 'tarball')
// eslint-disable-next-line promise/catch-or-return
t.resolveMatchSnapshot(pacote.tarball.file(abbrevspec, me + '/tarball.tgz'),
  'tarball to file').then(() =>
  t.match(fs.readFileSync(me + '/tarball.tgz'), fs.readFileSync(abbrev)))
// eslint-disable-next-line promise/catch-or-return
pacote.tarball.stream(abbrevspec, stream =>
  new Promise((res, rej) => {
    stream.on('end', res)
    stream.on('error', rej)
    stream.pipe(fs.createWriteStream(me + '/stream.tgz'))
  })).then(() =>
  t.match(fs.readFileSync(me + '/stream.tgz'), fs.readFileSync(abbrev)))

t.resolveMatchSnapshot(pacote.manifest(abbrevspec), 'manifest')

t.equal(pacote.GitFetcher, GitFetcher, 'should expose fetcher classes')
t.equal(pacote.RegistryFetcher, RegistryFetcher, 'should expose fetcher classes')
t.equal(pacote.FileFetcher, FileFetcher, 'should expose fetcher classes')
t.equal(pacote.DirFetcher, DirFetcher, 'should expose fetcher classes')
t.equal(pacote.RemoteFetcher, RemoteFetcher, 'should expose fetcher classes')
