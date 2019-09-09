const revs = require('../../../lib/util/git/revs.js')
const spawn = require('../../../lib/util/git/spawn.js')

const { resolve, basename } = require('path')
const repo = resolve(__dirname, basename(__filename, '.js'))

const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const { promisify } = require('util')

const t = require('tap')

mkdirp.sync(repo)
t.teardown(() => rimraf.sync(repo))

const fs = require('fs')

const git = (cmd) => spawn(cmd, {cwd: repo})
const write = (f, c) => fs.writeFileSync(`${repo}/${f}`, c)
t.test('setup', t =>
  promisify(rimraf)(repo)
  .then(() => mkdirp.sync(repo))
  .then(() => git(['init']))
  .then(() => write('foo', 'bar'))
  .then(() => git(['add', 'foo']))
  .then(() => git(['commit', '-m', 'foobar']))
  .then(() => git(['tag', '-a', 'asdf', '-m', 'asdf']))
  .then(() => write('bar', 'foo'))
  .then(() => git(['add', 'bar']))
  .then(() => git(['commit', '-m', 'barfoo']))
  .then(() => git(['tag', '-a', 'quux', '-m', 'quux']))
  .then(() => write('bob', 'obo'))
  .then(() => git(['add', 'bob']))
  .then(() => git(['commit', '-m', 'bob plays the obo']))
  .then(() => git(['tag', '-am', 'version 1.2.3', 'version-1.2.3']))
  .then(() => git(['tag', '-am', 'too big', '69' + Math.pow(2, 53) + '.0.0']))
  .then(() => write('gleep', 'glorp'))
  .then(() => git(['add', 'gleep']))
  .then(() => git(['commit', '-m', 'gleep glorp']))
  .then(() => git(['tag', '-am', 'head version', '69.42.0']))
)

t.test('point latest at HEAD', t =>
  revs(repo).then(r => t.same(r['dist-tags'],{
    HEAD: '69.42.0',
    latest: '69.42.0',
  })))

t.test('add a latest branch, point to 1.2.3 version', t =>
  git(['checkout', '-b', 'latest'])
  .then(() => git(['reset', '--hard', 'version-1.2.3']))
  .then(() => git(['checkout', 'master']))
)

// sharing is caring
const shaRE = /^[0-9a-f]{40}$/
const expect = {
  versions: {
    '1.2.3': {
      sha: shaRE,
      ref: 'version-1.2.3',
      type: 'tag'
    },
  },
  'dist-tags': {
    latest: '1.2.3',
    HEAD: '69.42.0',
  },
  refs: {
    latest: {
      sha: shaRE,
      ref: 'latest',
      type: 'branch'
    },
    master: {
      sha: shaRE,
      ref: 'master',
      type: 'branch'
    },
    '699007199254740992.0.0': {
      sha: shaRE,
      ref: '699007199254740992.0.0',
      type: 'tag'
    },
    asdf: {
      sha: shaRE,
      ref: 'asdf',
      type: 'tag'
    },
    quux: {
      sha: shaRE,
      ref: 'quux',
      type: 'tag'
    },
    'version-1.2.3': {
      sha: shaRE,
      ref: 'version-1.2.3',
      type: 'tag'
    }
  },
  shas: Object,
}

t.test('check the revs', t =>
  revs(repo, { noGitRevCache: true }).then(r => revs(repo).then(r2 => {
    t.equal(r, r2)
    t.match(r, expect)
    Object.keys(r.shas).forEach(sha => r.shas[sha].forEach(ref =>
      t.equal(r.refs[ref].sha, sha, 'shas list is consistent')))
  })))
