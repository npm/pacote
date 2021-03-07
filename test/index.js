const t = require('tap')
const pacote = require('../lib/index.js')
const fs = require('fs')

const GitFetcher = require('../lib/git.js')
const RegistryFetcher = require('../lib/registry.js')
const FileFetcher = require('../lib/file.js')
const DirFetcher = require('../lib/dir.js')
const RemoteFetcher = require('../lib/remote.js')

const { resolve, relative } = require('path')
const abbrev = resolve(__dirname, 'fixtures/abbrev-1.1.1.tgz')
const abbrevspec = `file:${relative(process.cwd(), abbrev)}`
const abbrevMani = require('./fixtures/abbrev-manifest-min.json')
const weird = resolve(__dirname, 'fixtures/weird-pkg.tgz')
const weirdspec = `file:${relative(process.cwd(), weird)}`
const ignore = resolve(__dirname, 'fixtures/ignore-pkg.tgz')
const ignorespec = `file:${relative(process.cwd(), ignore)}`

const mkdirp = require('mkdirp')
const me = t.testdir()

t.cleanSnapshot = str => str
  .split(process.cwd()).join('${CWD}')
  .replace(/\\/g, '/')

t.resolveMatchSnapshot(pacote.resolve(abbrevspec), 'resolve')
t.resolveMatchSnapshot(pacote.extract(abbrevspec, me + '/extract'), 'extract')
t.resolveMatchSnapshot(pacote.manifest(abbrevspec), 'manifest')
t.resolveMatchSnapshot(pacote.packument(abbrevspec), 'packument')
t.resolveMatch(pacote.tarball(abbrevspec), fs.readFileSync(abbrev), 'tarball')
t.resolveMatchSnapshot(pacote.tarball.file(abbrevspec, me + '/tarball.tgz'),
  'tarball to file').then(() =>
    t.match(fs.readFileSync(me + '/tarball.tgz'), fs.readFileSync(abbrev)))
const stream = pacote.tarball.stream(abbrevspec, stream =>
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
