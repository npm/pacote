// set this up first, so we can use 127.0.0.1 as our "hosted git" service
const httpPort = 18000 + (+process.env.TAP_CHILD_ID || 0)
const hostedUrl = `http://localhost:${httpPort}`
const ghi = require('hosted-git-info/lib/git-host-info.js')
const gitPort = 12345 + (+process.env.TAP_CHILD_ID || 0)

ghi.byShortcut['localhost:'] = 'localhost'
ghi.byDomain.localhost = 'localhost'
ghi.localhost = {
  protocols: ['git+https:', 'git+ssh:'],
  tarballtemplate: () => `${hostedUrl}/repo-HEAD.tgz`,
  sshurltemplate: (h) =>
    `git://127.0.0.1:${gitPort}/${h.user}${h.committish ? `#${h.committish}` : ''}`,
  shortcuttemplate: (h) =>
    `localhost:${h.user}/${h.project}${h.committish ? `#${h.committish}` : ''}`,
  extract: (url) => {
    const [, user, project] = url.pathname.split('/')
    return { user, project, committish: url.hash.slice(1) }
  },
}

ghi.byShortcut['localhosthttps:'] = 'localhosthttps'
ghi.byDomain['127.0.0.1'] = 'localhosthttps'
ghi.localhosthttps = {
  protocols: ['git+https:', 'git+ssh:', 'git:'],
  httpstemplate: (h) =>
    `git://127.0.0.1:${gitPort}/${h.user}${h.committish ? `#${h.committish}` : ''}`,
  shortcuttemplate: (h) => `localhosthttps:${h.user}/x${h.committish ? `#${h.committish}` : ''}`,
  extract: (url) => {
    const [, user, project] = url.pathname.split('/')
    return { user, project, committish: url.hash.slice(1) }
  },
}

ghi.byShortcut['localhostssh:'] = 'localhostssh'
ghi.byDomain.localhostssh = 'localhostssh'
ghi.localhostssh = {
  protocols: ['git+ssh:'],
  tarballtemplate: () => `${hostedUrl}/repo-HEAD.tgz`,
  sshurltemplate: (h) =>
    `git://127.0.0.1:${gitPort}/${h.user}${h.committish ? `#${h.committish}` : ''}`,
  httpstemplate: (h) =>
    `git://127.0.0.1:${gitPort}/${h.user}${h.committish ? `#${h.committish}` : ''}`,
  shortcuttemplate: (h) =>
    `localhostssh:${h.user}/${h.project}${h.committish ? `#${h.committish}` : ''}`,
  extract: (url) => {
    const [, user, project] = url.pathname.split('/')
    return { user, project, committish: url.hash.slice(1) }
  },
}

const remote = `git://localhost:${gitPort}/repo`
const remoteHosted = `git://127.0.0.1:${gitPort}/repo`
const submodsRemote = `git://localhost:${gitPort}/submodule-repo`
const workspacesRemote = `git://localhost:${gitPort}/workspaces-repo`
const prepackRemote = `git://localhost:${gitPort}/prepack-repo`

const GitFetcher = require('../lib/git.js')
const t = require('tap')
const fs = require('fs')
const http = require('http')

const { dirname, basename, resolve } = require('path')
const rimraf = require('rimraf')
const fixtures = resolve(__dirname, 'fixtures')
const abbrev = resolve(fixtures, 'abbrev-1.1.1.tgz')
const prepIgnore = resolve(fixtures, 'prepare-requires-gitignore-1.2.3.tgz')
const npa = require('npm-package-arg')

const me = t.testdir({
  repo: {},
  cache: {},
})
const repo = resolve(me, 'repo')
const cache = resolve(me, 'cache')
const cycleA = resolve(me, 'cycle-a')
const cycleB = resolve(me, 'cycle-b')

const abbrevSpec = `file:${abbrev}`

const opts = { cache, Arborist: require('@npmcli/arborist') }

const spawnGit = require('@npmcli/git').spawn
const { spawn } = require('child_process')
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
          'index.js',
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
      .then(({ stdout }) => REPO_HEAD = stdout.trim())
  })

  t.test('create cycle of git prepared deps', async t => {
    for (const repoDir of [cycleA, cycleB]) {
      const git = (...cmd) => spawnGit(cmd, { cwd: repoDir })
      const write = (f, c) => fs.writeFileSync(`${repoDir}/${f}`, c)
      const npm = (...cmd) => spawnNpm('npm', [
        ...cmd,
        '--no-sign-git-commit',
        '--no-sign-git-tag',
      ], repoDir)

      const other = repoDir === cycleA ? `git://localhost:${gitPort}/cycle-b`
        : `git://localhost:${gitPort}/cycle-a`
      const name = basename(repoDir)
      const otherName = basename(other)

      mkdirp.sync(repoDir)
      await git('init')
      await git('config', 'user.name', 'pacotedev')
      await git('config', 'user.email', 'i+pacotedev@izs.me')
      await git('config', 'tag.gpgSign', 'false')
      await git('config', 'commit.gpgSign', 'false')
      await git('config', 'tag.forceSignAnnotated', 'false')
      await write('package.json', JSON.stringify({
        name,
        version: '0.0.0',
        description: 'just some random thing',
        dependencies: {
          [otherName]: other,
        },
        scripts: {
          prepare: 'echo this is fine',
        },
      }))
      await git('add', 'package.json')
      await git('commit', '-m', 'package json file')
      await npm('version', '1.0.0')
    }
  })

  t.test('spawn daemon', t => {
    const daemon = spawn('git', [
      'daemon',
      `--port=${gitPort}`,
      '--export-all',
      '--verbose',
      '--informative-errors',
      '--reuseaddr',
      '--base-path=.',
      '--listen=localhost',
    ], { cwd: me, stdio: ['pipe', 1, 'pipe'] })
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
    const submoduleRepo = resolve(me, 'submodule-repo')
    const git = (...cmd) => spawnGit(cmd, { cwd: submoduleRepo })
    const write = (f, c) => fs.writeFileSync(`${submoduleRepo}/${f}`, c)
    mkdirp.sync(submoduleRepo)
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

  t.test('create a repo with workspaces', t => {
    const workspacesRepo = resolve(me, 'workspaces-repo')
    const wsfolder = resolve(me, 'workspaces-repo/a')
    const git = (...cmd) => spawnGit(cmd, { cwd: workspacesRepo })
    const write = (f, c) => fs.writeFileSync(`${workspacesRepo}/${f}`, c)
    mkdirp.sync(wsfolder)
    return git('init')
      .then(() => git('config', 'user.name', 'pacotedev'))
      .then(() => git('config', 'user.email', 'i+pacotedev@github.com'))
      .then(() => git('config', 'tag.gpgSign', 'false'))
      .then(() => git('config', 'commit.gpgSign', 'false'))
      .then(() => git('config', 'tag.forceSignAnnotated', 'false'))
      .then(() => write('package.json', JSON.stringify({
        name: 'workspaces-root',
        version: '1.2.3',
        workspaces: ['a'],
      })))
      .then(() => git('add', 'package.json'))
      .then(() => git('commit', '-m', 'package'))
      .then(() => write('a/package.json', JSON.stringify({
        name: 'a',
        version: '1.0.0',
        scripts: {
          prepare: 'touch foo',
        },
      })))
      .then(() => git('add', 'a/package.json'))
      .then(() => git('commit', '-m', 'a/package.json'))
  })

  t.test('create a repo with only a prepack script', t => {
    const prepackRepo = resolve(me, 'prepack-repo')
    const git = (...cmd) => spawnGit(cmd, { cwd: prepackRepo })
    const write = (f, c) => fs.writeFileSync(`${prepackRepo}/${f}`, c)
    mkdirp.sync(prepackRepo)
    return git('init')
      .then(() => git('config', 'user.name', 'pacotedev'))
      .then(() => git('config', 'user.email', 'i+pacotedev@github.com'))
      .then(() => git('config', 'tag.gpgSign', 'false'))
      .then(() => git('config', 'commit.gpgSign', 'false'))
      .then(() => git('config', 'tag.forceSignAnnotated', 'false'))
      .then(() => write('package.json', JSON.stringify({
        name: 'prepack-root',
        version: '1.0.0',
        scripts: {
          prepare: 'touch foo',
        },
      })))
      .then(() => git('add', 'package.json'))
      .then(() => git('commit', '-m', 'package.json'))
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
        case '/prepare-requires-gitignore-1.2.3.tgz': try {
          const data = fs.readFileSync(prepIgnore)
          return res.end(data)
        } catch (er) {
          res.statusCode = 500
          return res.end(er.stack)
        }
        default:
          res.statusCode = 404
          return res.end('not found')
      }
    })
    t.parent.parent.teardown(() => s.close())
    s.listen(httpPort, () => t.end())
  })

  t.end()
})

t.test('basic stuff', async t => {
  const g = new GitFetcher(remote, opts)
  t.same(g.types, ['git'])
  t.equal(g.resolved, null)
  const r = new GitFetcher(remote + '#' + REPO_HEAD, opts)
  t.equal(r.resolved, remote + '#' + REPO_HEAD)
  await g.resolve().then(resolved => t.equal(resolved, r.resolved))
  const s = new GitFetcher(remote + '#semver:1.x', opts)
  t.equal(s.resolved, null)
  await s.resolve().then(resolved => t.not(resolved, r.resolved))

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
    files: ['index.js'],
    _id: 'repo@1.0.0',
    _integrity: undefined, // _integrity should never be present for git deps npm/rfcs#525
    _resolved: `${remote}#${g.resolvedSha}`,
  })
  t.equal(await g.manifest(), gm, 'cached manifest')

  // one that doesn't have an npm install step, but does have submods
  const subs = new GitFetcher(submodsRemote, opts)
  await subs.extract(me + '/s')
  fs.statSync(me + '/s/fooblz/package.json')
})

t.test('ignores integrity for git deps', async (t) => {
  t.plan(3)
  const logHandler = (level, msg) => {
    t.equal(level, 'warn')
    t.match(msg, /^skipping integrity check for/)
  }

  process.on('log', logHandler)
  t.teardown(() => {
    process.removeListener('log', logHandler)
  })

  // known invalid integrity
  const fetcher = new GitFetcher(remote + '#' + REPO_HEAD,
    { ...opts, integrity: 'sha512-beeffeed' })
  const manifest = await fetcher.manifest()
  t.match(manifest, {
    _id: 'repo@1.0.0',
    _integrity: undefined, // _integrity should never be present for git deps npm/rfcs#525
    _resolved: `${remote}#${fetcher.resolvedSha}`,
  })
  t.end()
})

t.test('weird hosted that doesnt provide any fetch targets', t => {
  const hosted = {
    git () {
      return null
    },
    ssh () {
      return null
    },
    sshurl () {
      return null
    },
    https () {
      return null
    },
    tarball () {
      return null
    },
    shortcut () {
      return `weird:${remote}`
    },
  }

  const spec = npa(remote)
  spec.hosted = hosted
  t.rejects(new GitFetcher(Object.assign(spec, { hosted }), opts).resolve(), {
    message: `No git url for ${remote}`,
  })

  const resSpec = npa(`${remote}#${REPO_HEAD}`)
  resSpec.hosted = hosted
  t.rejects(new GitFetcher(Object.assign(resSpec, { hosted }), opts)
    .extract(`${me}/weird-hosted-extract`), {
    message: `No git url for ${remote}`,
  })

  t.end()
})

t.test('extract from tarball from hosted git service', async t => {
  // run in both ssh and https url types from a hosted service
  // both of these actually produce a git:// url so that the test
  // doesn't hang waiting for SSH key approval/passphrases.
  const domains = ['localhost', 'localhostssh']

  for (const domain of domains) {
    t.test(domain, async t => {
      const runTest = nameat => async t => {
        const spec = npa(`${nameat}${domain}:repo/x#${REPO_HEAD}`)
        const g = new GitFetcher(spec, opts)
        const m = await g.manifest()
        t.match(m, {
          name: 'repo',
          version: '1.0.0',
          description: 'just some random thing',
          devDependencies: {
            abbrev: abbrevSpec,
          },
          scripts: { prepare: 'node prepare.js', test: 'node index.js' },
          files: ['index.js'],
          _id: 'repo@1.0.0',
          _integrity: /^sha512-/,
          _resolved: `${remoteHosted}#${REPO_HEAD}`,
        })
        const p = await g.packument()
        t.match(p, {
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
              files: ['index.js'],
              _id: 'repo@1.0.0',
              _integrity: /^sha512-/,
              _resolved: `${remoteHosted}#${REPO_HEAD}`,
              dist: {},
            },
          },
        })
        await g.extract(me + '/hosted')
        t.throws(() => fs.statSync(me + '/hosted/prepare.js'))
        fs.statSync(me + '/hosted/index.js')
      }

      t.test('with repo@ on the spec', runTest('repo@'))
      t.test('without repo@on the spec', runTest(''))
    })
  }
})

t.test('include auth with hosted https when provided', async t => {
  const spec = `git+https://user:pass@127.0.0.1/repo`
  const g = new GitFetcher(spec, opts)
  const resolved = await g.resolve()
  // this weird url is because our fakey mock hosted service's
  // https() method returns a git:// url, since the git daemon we
  // spun up only responds to the git:// protocol, not https.
  // But! we are verifying that it IS using the https() method,
  // and not the sshurl() method, because that one returns a
  // 'do not use this' string.
  t.equal(resolved, `git+git://127.0.0.1:${gitPort}/repo#${REPO_HEAD}`)
  t.equal(g.spec.hosted.shortcut(), 'localhosthttps:repo/x',
    'using the correct dummy hosted service')

  t.test('fail, but do not fall through to sshurl', async t => {
    const badSpec = `git+https://user:pass@127.0.0.1/no-repo-here`
    const failer = new GitFetcher(badSpec, {
      ...opts,
      resolved: resolved.replace(/\/repo/, '/no-repo-here'),
    })
    t.equal(failer.spec.hosted.shortcut(), 'localhosthttps:no-repo-here/x',
      'using the correct dummy hosted service')
    const path = t.testdir({})
    await t.rejects(failer.extract(path), {
      args: ['--no-replace-objects', 'ls-remote', `git://127.0.0.1:${gitPort}/no-repo-here`],
    })
  })
})

t.test('include .gitignore in hosted tarballs for preparation', async t => {
  const spec = npa(`localhost:foo/y#${REPO_HEAD}`)
  spec.hosted.tarball = () =>
    `http://localhost:${httpPort}/prepare-requires-gitignore-1.2.3.tgz`
  const g = new GitFetcher(spec, opts)
  const dir = t.testdir()
  await g.extract(dir)
  t.strictSame(fs.readdirSync(dir).sort((a, b) => a.localeCompare(b)), [
    'index.js',
    'package.json',
    'prepare_ran_successfully',
  ])
})

t.test('add git sha to hosted git shorthand', t =>
  new GitFetcher('localhost:repo/x', opts)
    // it adds the git+ because it thinks it's https
    .resolve().then(r => t.equal(r, `git+${remoteHosted}#${REPO_HEAD}`)))

t.test('fetch a weird ref', t => {
  let head3 = ''
  t.test('hosted', async t => {
    const result = await new GitFetcher('localhost:repo/x#HEAD~3', opts).extract(me + '/h3h')
    head3 = result.resolved.split('#').pop()
    t.match(result.resolved, /^git\+git:\/\/127\.0\.0\.1:[0-9]+\/repo#[a-z0-9]{40}$/,
      'got git url as resolved value')
    t.not(result.resolved, `${remoteHosted}#${REPO_HEAD}`,
      'git url for HEAD~3 is not the same as HEAD')
  })

  t.test('regular', async t => {
    const result = await new GitFetcher(`${remote}#HEAD~3`, opts).extract(me + '/h3r')
    t.equal(result.resolved, `${remote}#${head3}`, 'got the same HEAD~3 sha as before')
  })

  t.end()
})

t.test('fetch a private repo where the tgz is a 404', t => {
  const gf = new GitFetcher(`localhost:repo/x#${REPO_HEAD}`, opts)
  gf.spec.hosted.tarball = () => `${hostedUrl}/not-found.tgz`
  // should fetch it by falling back to ssh when it gets an http error
  return gf.extract(me + '/no-tgz')
})

t.test('fetch a private repo where the tgz is not a tarball', t => {
  const gf = new GitFetcher(`localhost:repo/x#${REPO_HEAD}`, opts)
  gf.spec.hosted.tarball = () => `${hostedUrl}/not-tar.tgz`
  // should NOT retry, because the error was not an HTTP fetch error
  return t.rejects(gf.extract(me + '/bad-tgz'), {
    code: 'TAR_BAD_ARCHIVE',
  })
})

t.test('resolved is a git+ssh url for hosted repos that support it', t => {
  const hash = '0000000000000000000000000000000000000000'
  const gf = new GitFetcher(`github:x/y#${hash}`, { ...opts, cache: null })
  t.equal(gf.resolved, `git+ssh://git@github.com/x/y.git#${hash}`)
  t.end()
})

t.test('resolved preserves git+ssh url for non-hosted repos', t => {
  const hash = '0000000000000000000000000000000000000000'
  const url = `git+ssh://git@test/x/y.git#${hash}`
  const gf = new GitFetcher(url, { ...opts, cache: null })
  t.equal(gf.resolved, url)
  t.end()
})

t.test('fall back to ssh url if https url fails or is missing', t => {
  const gf = new GitFetcher(`localhostssh:repo/x`, opts)
  return gf.extract(`${me}/localhostssh`).then(({ resolved }) =>
    t.equal(resolved, `git+git://127.0.0.1:${gitPort}/repo#${REPO_HEAD}`))
})

t.test('repoUrl function', async t => {
  const proj = 'isaacs/abbrev-js'
  const { hosted: shortcut } = npa(`github:${proj}`)
  const { hosted: hasAuth } = npa(`git+https://user:pass@github.com/${proj}`)
  const { hosted: noAuth } = npa(`git+https://github.com/${proj}`)
  const { hosted: ssh } = npa(`git+ssh://git@github.com/${proj}`)
  const { hosted: git } = npa(`git://github.com/${proj}`)
  const { repoUrl } = GitFetcher
  const expectNoAuth = `git+ssh://git@github.com/${proj}`
  const expectAuth = `git+https://user:pass@github.com/${proj}`
  t.match(repoUrl(shortcut), expectNoAuth)
  t.match(repoUrl(hasAuth), expectAuth)
  t.match(repoUrl(noAuth), expectNoAuth)
  t.match(repoUrl(ssh), expectNoAuth)
  t.match(repoUrl(git), expectNoAuth)
})

t.test('handle it when prepared git deps depend on each other', async t => {
  // now we've created both repos, and they each depend on the other
  // our mocked npm bin should safely prevent an infinite regress if
  // this test fails, and just log that the appropriate env got set.
  const path = t.testdir({
    'npm-mock.js': fs.readFileSync(resolve(fixtures, 'npm-mock.js')).toString(),
  })

  process.env._PACOTE_TEST_PATH_ = dirname(__dirname)
  process.env._PACOTE_TEST_OPTS_ = JSON.stringify(opts)
  t.teardown(() => {
    delete process.env._PACOTE_TEST_PATH_
    delete process.env._PACOTE_TEST_OPTS_
  })

  for (const project of ['cycle-a', 'cycle-b']) {
    const localRemote = `git://localhost:${gitPort}/${project}`
    const local = `${path}/${project}`
    const npmBin = `${path}/npm-mock.js`
    const g = new GitFetcher(localRemote, { ...opts, npmBin })
    await g.extract(local)
    const log = JSON.parse(fs.readFileSync(`${local}/log`, 'utf8'))
    t.match(log, {
      argv: [
        process.execPath,
        npmBin,
      ],
      noPrepare: [g.resolved],
      cwd: new RegExp(`${me}/cache/tmp/git-clone[a-zA-Z0-9]{6,8}`),
    })
    // our rudimentary package manager dumps the deps into the pkg root
    // but it doesn't get installed once the loop is detected.
    const base = basename(local)
    const other = base === 'cycle-a' ? 'cycle-b' : 'cycle-a'
    t.strictSame(require(`${path}/${base}/${other}/${base}/package.json`),
      require(`${local}/package.json`))
    t.throws(() => {
      require(`${path}/${base}/${other}/${base}/${other}/package.json`)
    }, 'does not continue installing once loop is detected')
  }
})

t.test('missing branch name throws pathspec error', async (t) => {
  const domains = ['localhostssh', 'localhosthttps', 'localhost']

  for (const domain of domains) {
    await t.rejects(
      new GitFetcher(
        `${domain}:repo/x#this-branch-does-not-exist`,
        opts
      ).resolve(),
      {
        constructor: /GitPathspecError/,
      },
      domain
    )
    await t.rejects(
      new GitFetcher(
        `${domain}:repo/x#this-branch-does-not-exist`,
        opts
      ).manifest(),
      {
        constructor: /GitPathspecError/,
      }, domain)
  }
})

t.test('simple repo with workspaces', async t => {
  const ws = new GitFetcher(workspacesRemote, opts)
  const extract = resolve(me, 'extract-workspaces')
  await ws.extract(extract)
  // the file ./a/foo does not exist in the original repo
  // and should have been created during prepare phase
  t.ok(
    fs.statSync(me + '/extract-workspaces/a/foo'),
    'should run prepare phase when finding workspaces'
  )
})

t.test('simple repo with only a prepack script', async t => {
  const ws = new GitFetcher(prepackRemote, opts)
  const extract = resolve(me, 'extract-prepack')
  await ws.extract(extract)
  // the file ./foo does not exist in the original repo
  // and should have been created when running prepack
  t.ok(
    fs.statSync(me + '/extract-prepack/foo'),
    'should run prepack lifecycle script'
  )
})

t.test('fails without arborist constructor', async t => {
  const ws = new GitFetcher(prepackRemote, { cache })
  const extract = resolve(me, 'extract-prepack')
  t.rejects(() => ws.extract(extract))
})
