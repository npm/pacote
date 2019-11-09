// set this up first, so we can use 127.0.0.1 as our "hosted git" service
const httpPort = 18000 + (+process.env.TAP_CHILD_ID || 0)
const hostedUrl = `http://localhost:${httpPort}`
const ghi = require('hosted-git-info/git-host-info.js')
const gitPort = 12345 + (+process.env.TAP_CHILD_ID || 0)
const remote = `git://localhost:${gitPort}/repo`
const remoteHosted = `git://127.0.0.1:${gitPort}/repo`
const submodsRemote = `git://localhost:${gitPort}/submodule-repo`
ghi.localhost = {
  protocols: [ 'git' ],
  domain: `127.0.0.1:${gitPort}`,
  gittemplate: 'git://{domain}/{user}{#committish}',
  treepath: 'not-implemented',
  tarballtemplate: `${hostedUrl}/repo-HEAD.tgz`,
  // shortcut MUST have a user and project, at least
  shortcuttemplate: '{type}:{user}/x{#committish}',
  pathtemplate: '/{user}{#committish}',
  pathmatch: /^\/(repo|submodule-repo)/,
  hashformat: h => h,
  protocols_re: /^(git):$/
}

const GitFetcher = require('../lib/git.js')
const t = require('tap')
const fs = require('fs')
const http = require('http')

const {resolve} = require('path')
const rimraf = require('rimraf')
const abbrev = resolve(__dirname, 'fixtures/abbrev-1.1.1.tgz')
const npa = require('npm-package-arg')

t.saveFixture = true
const me = t.testdir({
  repo: {},
  cache: {},
})
const repo = resolve(me, 'repo')
const cache = resolve(me, 'cache')

const abbrevSpec = `file:${abbrev}`

const spawnGit = require('../lib/util/git/spawn.js')
const {spawn} = require('child_process')
const spawnNpm = require('../lib/util/npm.js')

const mkdirp = require('mkdirp')

const tar = require('tar')

let REPO_HEAD = ''
t.test('setup', { bail: true }, t => {
  t.test('create repo', t => {
    const git = (...cmd) => spawnGit(cmd, { cwd: repo })
    const write = (f, c) => fs.writeFileSync(`${repo}/${f}`, c)
    const npm = (...cmd) => spawnNpm('npm', [
      ...cmd,
      '--no-sign-git-commit',
      '--no-sign-git-tag',
    ], repo)

    mkdirp.sync(repo)
    return git('init')
    .then(() => git('config', 'user.name', 'pacotedev'))
    .then(() => git('config', 'user.email', 'i+pacotedev@izs.me'))
    .then(() => git('config', 'tag.gpgSign', 'false'))
    .then(() => git('config', 'commit.gpgSign', 'false'))
    .then(() => git('config', 'tag.forceSignAnnotated', 'false'))
    .then(() => write('package.json', JSON.stringify({
      name: 'repo',
      version: '0.0.0',
      description: 'just some random thing',
      devDependencies: {
        abbrev: abbrevSpec,
      },
      scripts: {
        prepare: 'node prepare.js',
        test: 'node index.js',
      },
      files: [
        'index.js'
      ],
    })))
    .then(() => git('add', 'package.json'))
    .then(() => git('commit', '-m', 'package json file'))

    .then(() => write('.gitignore', 'index.js'))
    .then(() => git('add', '.gitignore'))
    .then(() => git('commit', '-m', 'ignore file'))

    .then(() => write('prepare.js', `
    const fs = require('fs')
    require('abbrev')
    fs.writeFileSync(__dirname + '/index.js', 'console.log("ok")')
    `))
    .then(() => git('add', 'prepare.js'))
    .then(() => git('commit', '-m', 'prepare script'))

    .then(() => write('README.md', 'some docs'))
    .then(() => git('add', 'README.md'))
    .then(() => git('commit', '-m', 'docs'))

    .then(() => npm('version', '1.0.0'))

    // for our hosted service
    .then(() => tar.c({
      file: me + '/repo-1.0.0.tgz',
      gzip: true,
      cwd: me,
      portable: true,
    }, ['repo']))

    .then(() => write('README.md', 'some docs and some more docs'))
    .then(() => git('add', 'README.md'))
    .then(() => git('commit', '-m', 'some more docs'))

    .then(() => tar.c({
      file: me + '/repo-HEAD.tgz',
      gzip: true,
      cwd: me,
      portable: true,
    }, ['repo']))

    .then(() => git('rev-parse', '--revs-only', 'HEAD'))
    .then(sha => REPO_HEAD = sha.trim())
  })

  t.test('spawn daemon', t => {
    const daemon = spawn('git', [
      'daemon',
      `--port=${gitPort}`,
      '--export-all',
      '--verbose',
      '--informative-errors',
      '--reuseaddr',
      `--base-path=.`,
      '--listen=localhost',
    ], { cwd: me, stdio: ['pipe', 1, 'pipe' ] })
    const onDaemonData = c => {
      // prepare to slay the daemon
      const cpid = c.toString().match(/^\[(\d+)\]/)
      if (cpid && cpid[1]) {
        daemon.stderr.removeListener('data', onDaemonData)
        const pid = +cpid[1]
        t.parent.parent.teardown(() => process.kill(pid))
        t.end()
      }
    }
    daemon.stderr.on('data', onDaemonData)
    // only clean up the dir once the daemon is banished
    daemon.on('close', () => rimraf.sync(me))
  })

  t.test('create a repo with a submodule', t => {
    const repo = resolve(me, 'submodule-repo')
    const git = (...cmd) => spawnGit(cmd, { cwd: repo })
    const write = (f, c) => fs.writeFileSync(`${repo}/${f}`, c)
    mkdirp.sync(repo)
    return git('init')
      .then(() => git('config', 'user.name', 'pacotedev'))
      .then(() => git('config', 'user.email', 'i+pacotedev@izs.me'))
      .then(() => git('config', 'tag.gpgSign', 'false'))
      .then(() => git('config', 'commit.gpgSign', 'false'))
      .then(() => git('config', 'tag.forceSignAnnotated', 'false'))
      .then(() => write('package.json', JSON.stringify({
        name: 'submod-repo',
        version: '1.2.3',
      })))
      .then(() => git('add', 'package.json'))
      .then(() => git('commit', '-m', 'package'))
      .then(() => write('file', 'data'))
      .then(() => git('add', 'file'))
      .then(() => git('commit', '-m', 'file'))
      .then(() => git('submodule', 'add', remote, 'fooblz'))
      .then(() => git('commit', '-m', 'add submodule'))
      .then(() => write('foo', 'bar'))
      .then(() => git('add', 'foo'))
      .then(() => git('commit', '-m', 'foobar'))
      .then(() => git('tag', '-a', 'asdf', '-m', 'asdf'))
      .then(() => write('bar', 'foo'))
      .then(() => git('add', 'bar'))
      .then(() => git('commit', '-m', 'barfoo'))
      .then(() => git('tag', 'quux'))
      .then(() => write('bob', 'obo'))
      .then(() => git('add', 'bob'))
      .then(() => git('commit', '-m', 'bob plays the obo'))
      .then(() => write('pull-file', 'a humble request that you pull'))
      .then(() => git('add', 'pull-file'))
      .then(() => git('commit', '-m', 'the ref file'))
      .then(() => git('update-ref', 'refs/pull/1/head', 'HEAD'))
      .then(() => write('rando-ref', 'some rando ref'))
      .then(() => git('add', 'rando-ref'))
      .then(() => git('commit', '-m', 'so rando'))
      .then(() => git('update-ref', 'refs/rando/file', 'HEAD'))
      .then(() => write('other-file', 'file some other bits'))
      .then(() => git('add', 'other-file'))
      .then(() => git('commit', '-m', 'others'))
      .then(() => git('tag', '-am', 'version 1.2.3', 'version-1.2.3'))
      .then(() => git('tag', '-am', 'too big', '69' + Math.pow(2, 53) + '.0.0'))
      .then(() => write('gleep', 'glorp'))
      .then(() => git('add', 'gleep'))
      .then(() => git('commit', '-m', 'gleep glorp'))
      .then(() => git('tag', '-am', 'head version', '69.42.0'))
      .then(() => write('package.json', JSON.stringify({
        name: 'submod-repo',
        version: '69.42.0',
      })))
      .then(() => git('add', 'package.json'))
      .then(() => git('commit', '-m', 'package'))
  })

  t.test('hosted service', t => {
    const s = http.createServer((req, res) => {
      res.setHeader('connection', 'close')
      switch (req.url) {
        case '/repo-HEAD.tgz': try {
          const data = fs.readFileSync(me + '/repo-HEAD.tgz')
          res.setHeader('content-length', data.length)
          return res.end(data)
        } catch (er) {
          res.statusCode = 500
          res.end(er.stack)
        }
        case '/repo-1.0.0.tgz': try {
          const data = fs.readFileSync(me + '/repo-1.0.0.tgz')
          res.setHeader('content-length', data.length)
          return res.end(data)
        } catch (er) {
          res.statusCode = 500
          res.end(er.stack)
        }
        default:
          res.statusCode = 404
          return res.end('not found')
      }
    })
    t.parent.parent.tearDown(() => s.close())
    s.listen(httpPort, () => t.end())
  })

  t.end()
})

t.test('basic stuff', async t => {
  const g = new GitFetcher(remote, {cache})
  t.same(g.types, ['git'])
  t.equal(g.resolved, null)
  const r = new GitFetcher(remote + '#' + REPO_HEAD, {cache})
  t.equal(r.resolved, remote + '#' + REPO_HEAD)
  await g.resolve().then(resolved => t.equal(resolved, r.resolved))
  const s = new GitFetcher(remote + '#semver:1.x', {cache})
  t.equal(s.resolved, null)
  await s.resolve().then(resolved => t.notEqual(resolved, r.resolved))

  const gx = await g.extract(me + '/g')
  const rx = await r.extract(me + '/r')
  t.equal(gx.resolved, rx.resolved, 'got the same resolved')
  t.equal(gx.integrity, rx.integrity, 'got the same integrity')

  // prepare script ran, files were filtered properly
  fs.statSync(me + '/g/index.js')
  t.throws(() => fs.statSync(me + '/g/prepare.js'))

  const gm = await g.manifest()
  t.equal(gm, g.package)
  t.match(gm, {
    name: 'repo',
    version: '1.0.0',
    description: 'just some random thing',
    devDependencies: {
      abbrev: abbrevSpec,
    },
    scripts: { prepare: 'node prepare.js', test: 'node index.js' },
    files: [ 'index.js' ],
    readme: 'some docs and some more docs',
    readmeFilename: 'README.md',
    gitHead: g.resolvedSha,
    _id: 'repo@1.0.0',
    _integrity: `${g.integrity}`,
    _resolved: `${remote}#${g.resolvedSha}`,
  })
  t.equal(await g.manifest(), gm, 'cached manifest')

  // one that doesn't have an npm install step, but does have submods
  const subs = new GitFetcher(submodsRemote, {cache})
  await subs.extract(me + '/s')
  fs.statSync(me + '/s/fooblz/package.json')
})

t.test('weird hosted that doesnt provide .git()', t => {
  const spec = npa(remote)
  spec.hosted = {
    git () { return null },
    tarball () { return null },
  }
  const r = new GitFetcher(spec, {cache})
  return t.rejects(r.resolve(), {
    message: `No git url for ${remote}`,
  })
})

t.test('extract from tarball from hosted git service', t => {
  const spec = npa(`repo@localhost:repo/x#${REPO_HEAD}`)
  const g = new GitFetcher(spec, {cache})
  return g.manifest().then(m => t.match(m, {
    name: 'repo',
    version: '1.0.0',
    description: 'just some random thing',
    devDependencies: {
      abbrev: abbrevSpec
    },
    scripts: { prepare: 'node prepare.js', test: 'node index.js' },
    files: [ 'index.js' ],
    readme: 'some docs and some more docs',
    readmeFilename: 'README.md',
    _id: 'repo@1.0.0',
    _integrity: /^sha512-/,
    _resolved: `${hostedUrl}/repo-HEAD.tgz`,
  }))
  .then(() => g.packument())
  .then(p => t.match(p, {
    name: 'repo',
    'dist-tags': { latest: '1.0.0' },
    versions: {
      '1.0.0': {
        name: 'repo',
        version: '1.0.0',
        description: 'just some random thing',
        devDependencies: {
          abbrev: abbrevSpec,
        },
        scripts: { prepare: 'node prepare.js', test: 'node index.js' },
        files: [ 'index.js' ],
        readme: 'some docs and some more docs',
        readmeFilename: 'README.md',
        _id: 'repo@1.0.0',
        _integrity: /^sha512-/,
        _resolved: `${hostedUrl}/repo-HEAD.tgz`,
        dist: {},
      }
    }
  }))
  .then(() => g.extract(me + '/hosted'))
  .then(() => {
    t.throws(() => fs.statSync(me + '/hosted/prepare.js'))
    fs.statSync(me + '/hosted/index.js')
  })
})

t.test('add git sha to hosted git shorthand', t =>
  new GitFetcher('localhost:repo/x', {cache})
    .resolve().then(r => t.equal(r, `${hostedUrl}/repo-HEAD.tgz`)))

t.test('fetch a weird ref', t => {
  t.test('hosted', t =>
    new GitFetcher('localhost:repo/x#HEAD~3', {cache}).extract(me + '/h3h')
    .then(result => t.equal(result.resolved, `${hostedUrl}/repo-HEAD.tgz`)))

  t.test('reglar', t =>
    new GitFetcher(`${remote}#HEAD~3`, {cache}).extract(me + '/h3r')
    .then(result => t.notEqual(result.resolved,
      `${remote}#${REPO_HEAD}`, 'something other than default head')))

  t.end()
})
