const t = require('tap')
const { readFile, readdir, writeFile } = require('node:fs/promises')
const { join } = require('node:path')
const { pathToFileURL } = require('node:url')
const git = require('@npmcli/git').spawn
const npa = require('npm-package-arg')
const Arborist = require('@npmcli/arborist')
const pacote = require('../lib/index.js')

const fixture = async t => {
  const dir = t.testdir({ https: {}, ssh: { repo: {}, submodule: {} } })
  const env = { ...process.env, GIT_ALLOW_PROTOCOL: 'file' }
  const run = (cwd, ...args) => git(args, { cwd, env })
  const init = async cwd => {
    await run(cwd, 'init')
    await run(cwd, 'config', 'user.name', 'fixture')
    await run(cwd, 'config', 'user.email', 'fixture@example.com')
  }
  const repo = join(dir, 'ssh/repo')
  const submodule = join(dir, 'ssh/submodule')
  await init(submodule)
  await writeFile(join(submodule, 'marker'), 'submodule contents\n')
  await run(submodule, 'add', '.')
  await run(submodule, 'commit', '-m', 'submodule')
  await init(repo)
  await writeFile(join(repo, 'package.json'), JSON.stringify({
    name: 'fallback-fixture', version: '1.0.0',
  }))
  await run(repo, 'submodule', 'add', submodule, 'vendor/submodule')
  await run(repo, 'config', '-f', '.gitmodules', 'submodule.vendor/submodule.url', '../submodule')
  await run(repo, 'add', '.')
  await run(repo, 'commit', '-m', 'package with relative submodule')
  await run(dir, 'clone', '--bare', repo, join(dir, 'https/repo'))

  const spec = npa('github:fixture/repo')
  // Both transports expose the same commit. The first clone fails after
  // checkout because its relative submodule repository is unavailable.
  spec.hosted.https = () => pathToFileURL(join(dir, 'https/repo')).href
  spec.hosted.sshurl = () => pathToFileURL(repo).href
  spec.hosted.tarball = null
  return { dir, spec, opts: { env, cache: join(dir, 'cache'), Arborist, gitShallow: false } }
}

t.test('retry a partial HTTPS clone in a clean directory', async t => {
  const { dir, spec, opts } = await fixture(t)
  const dest = join(dir, 'output')
  await pacote.extract(spec, dest, opts)
  t.equal(JSON.parse(await readFile(join(dest, 'package.json'))).name, 'fallback-fixture')
  t.equal(await readFile(join(dest, 'vendor/submodule/marker'), 'utf8'), 'submodule contents\n')
})

t.test('report the SSH failure instead of a leftover-directory error', async t => {
  const { dir, spec, opts } = await fixture(t)
  const missing = pathToFileURL(join(dir, 'missing')).href
  spec.hosted.sshurl = () => missing
  await t.rejects(pacote.extract(spec, join(dir, 'output'), opts), {
    args: ['--no-replace-objects', 'ls-remote', missing],
  })
  t.same(await readdir(join(opts.cache, 'tmp')), [], 'failed clone is removed')
})

t.test('a successful HTTPS clone does not need the SSH fallback', async t => {
  const { dir, spec, opts } = await fixture(t)
  spec.hosted.https = spec.hosted.sshurl
  spec.hosted.sshurl = () => pathToFileURL(join(dir, 'missing')).href
  const dest = join(dir, 'output')
  await pacote.extract(spec, dest, opts)
  t.equal(await readFile(join(dest, 'vendor/submodule/marker'), 'utf8'), 'submodule contents\n')
})
