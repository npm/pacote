const FileFetcher = require('../lib/file.js')
const t = require('tap')
const { relative, resolve, basename } = require('path')
const npa = require('npm-package-arg')
const { promisify } = require('util')
const rimraf = promisify(require('rimraf'))
const mkdirp = require('mkdirp')
const me = resolve(__dirname, basename(__filename, '.js'))
rimraf.sync(me)
mkdirp.sync(me)
t.teardown(() => rimraf.sync(me))

const abbrev = resolve(__dirname, 'fixtures/abbrev-1.1.1.tgz')
const abbrevspec = `file:${relative(process.cwd(), abbrev)}`
const abbrevMani = require('./fixtures/abbrev-manifest-min.json')

t.test('basic', t => {
  const f = new FileFetcher(abbrevspec, {})
  t.same(f.types, ['file'])
  t.resolveMatchSnapshot(f.packument(), 'packument')
  t.resolveMatchSnapshot(f.manifest(), 'manifest')
  const pj = me + '/extract/package.json'
  return t.resolveMatchSnapshot(f.extract(me + '/extract'), 'extract')
    .then(() => t.matchSnapshot(require(pj), 'package.json extracted'))
})
