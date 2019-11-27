// set this up first, so we can use 127.0.0.1 as our "hosted git" service
const httpPort = 18000 + (+process.env.TAP_CHILD_ID || 0)
const hostedUrl = `http://localhost:${httpPort}`
const ghi = require('hosted-git-info/git-host-info.js')
const gitPort = 12345 + (+process.env.TAP_CHILD_ID || 0)
ghi.localhost = {
  protocols: [ 'git+https', 'git+ssh' ],
  domain: `127.0.0.1:${gitPort}`,
  httpstemplate: 'git://{domain}/{user}{#committish}',
  treepath: 'not-implemented',
  tarballtemplate: `${hostedUrl}/repo-HEAD.tgz`,
  // shortcut MUST have a user and project, at least
  shortcuttemplate: '{type}:{user}/x{#committish}',
  pathtemplate: '/{user}{#committish}',
  pathmatch: /^\/(repo|submodule-repo)/,
  hashformat: h => h,
  protocols_re: /^(git):$/
}
ghi.localhostssh = {
  protocols: [ 'git+ssh' ],
  domain: `localhostssh:${gitPort}`,
  sshtemplate: `git://127.0.0.1:${gitPort}/{user}{#committish}`,
  sshurltemplate: `git://127.0.0.1:${gitPort}/{user}{#committish}`,
  treepath: 'not-implemented',
  tarballtemplate: `${hostedUrl}/repo-HEAD.tgz`,
  // shortcut MUST have a user and project, at least
  shortcuttemplate: '{type}:{user}/x{#committish}',
  pathtemplate: '/{user}{#committish}',
  pathmatch: /^\/(repo|submodule-repo)/,
  hashformat: h => h,
  protocols_re: /^(git):$/
}


const remote = `git://localhost:${gitPort}/repo`
const remoteHosted = `git://127.0.0.1:${gitPort}/repo`
const submodsRemote = `git://localhost:${gitPort}/submodule-repo`

const remoteHostedSSH = `git://localhostssh:${gitPort}/repo`

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
          return res.end(er.stack)
        }
        case '/repo-1.0.0.tgz': try {
          const data = fs.readFileSync(me + '/repo-1.0.0.tgz')
          res.setHeader('content-length', data.length)
          return res.end(data)
        } catch (er) {
          res.statusCode = 500
          return res.end(er.stack)
        }
        case '/not-tar.tgz':
          res.statusCode = 200
          return res.end('this is not a gzipped tarball tho')
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

t.test('weird hosted that doesnt provide any fetch targets', t => {
  const hosted = {
    git () { return null },
    ssh () { return null },
    sshurl () { return null },
    https () { return null },
    tarball () { return null },
    shortcut () { return `weird:${remote}` },
  }

  const spec = npa(remote)
  spec.hosted = hosted
  t.rejects(new GitFetcher(Object.assign(spec, {hosted}), {cache}).resolve(), {
    message: `No git url for ${remote}`,
  })

  const resSpec= npa(`${remote}#${REPO_HEAD}`)
  resSpec.hosted = hosted
  t.rejects(new GitFetcher(Object.assign(resSpec, {hosted}), {cache})
    .extract(`${me}/weird-hosted-extract`), {
    message: `No git url for ${remote}`,
  })

  t.end()
})

t.test('extract from tarball from hosted git service', t => {
  // run in both ssh and https url types from a hosted service
  // both of these actually produce a git:// url so that the test
  // doesn't hang waiting for SSH key approval/passphrases.
  const domains = ['localhost', 'localhostssh']

  t.plan(domains.length)
  domains.forEach(domain => t.test(domain, t => {
    const runTest = nameat => t => {
      const spec = npa(`${nameat}${domain}:repo/x#${REPO_HEAD}`)
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
        _id: 'repo@1.0.0',
        _integrity: /^sha512-/,
        _resolved: `${remoteHosted}#${REPO_HEAD}`,
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
            _id: 'repo@1.0.0',
            _integrity: /^sha512-/,
            _resolved: `${remoteHosted}#${REPO_HEAD}`,
            dist: {},
          }
        }
      }))
      .then(() => g.extract(me + '/hosted'))
      .then(result => {
        t.throws(() => fs.statSync(me + '/hosted/prepare.js'))
        fs.statSync(me + '/hosted/index.js')
      })
    }

    t.plan(2)
    t.test('with repo@ on the spec', runTest('repo@'))
    t.test('without repo@on the spec', runTest(''))
  }))
})

t.test('add git sha to hosted git shorthand', t =>
  new GitFetcher('localhost:repo/x', {cache})
    // it adds the git+ because it thinks it's https
    .resolve().then(r => t.equal(r, `git+${remoteHosted}#${REPO_HEAD}`)))

t.test('fetch a weird ref', t => {
  let head3 = ''
  t.test('hosted', t =>
    new GitFetcher('localhost:repo/x#HEAD~3', {cache}).extract(me + '/h3h')
    .then(result => {
      head3 = result.resolved.split('#').pop()
      t.match(result.resolved, /^git\+git:\/\/127\.0\.0\.1:[0-9]+\/repo#[a-z0-9]{40}$/,
        'got git url as resolved value')
      t.notEqual(result.resolved, `${remoteHosted}#${REPO_HEAD}`,
        'git url for HEAD~3 is not the same as HEAD')
    }))

  t.test('reglar', t =>
    new GitFetcher(`${remote}#HEAD~3`, {cache}).extract(me + '/h3r')
    .then(result => t.equal(result.resolved, `${remote}#${head3}`,
      'got the same HEAD~3 sha as before')))

  t.end()
})

t.test('fetch a private repo where the tgz is a 404', t => {
  const gf = new GitFetcher(`localhost:repo/x#${REPO_HEAD}`, {cache})
  gf.spec.hosted.tarball = () => `${hostedUrl}/not-found.tgz`
  // should fetch it by falling back to ssh when it gets an http error
  return gf.extract(me + '/no-tgz')
})

t.test('fetch a private repo where the tgz is not a tarball', t => {
  const gf = new GitFetcher(`localhost:repo/x#${REPO_HEAD}`, {cache})
  gf.spec.hosted.tarball = () => `${hostedUrl}/not-tar.tgz`
  // should NOT retry, because the error was not an HTTP fetch error
  return t.rejects(gf.extract(me + '/bad-tgz'), {
    code: 'TAR_BAD_ARCHIVE',
  })
})

t.test('resolved is a git+ssh url for hosted repos that support it', t => {
  const hash = '0000000000000000000000000000000000000000'
  const gf = new GitFetcher(`github:x/y#${hash}`, {})
  t.equal(gf.resolved, `git+ssh://git@github.com/x/y.git#${hash}`)
  t.end()
})

t.test('fall back to ssh url if https url fails or is missing', t => {
  const gf = new GitFetcher(`localhostssh:repo/x`, {cache})
  return gf.extract(`${me}/localhostssh`).then(({resolved}) =>
    t.equal(resolved, `git+git://127.0.0.1:${gitPort}/repo#${REPO_HEAD}`))
})
