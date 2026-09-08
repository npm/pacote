const t = require('tap')
const npa = require('npm-package-arg')
const addGitSha = require('../../lib/util/add-git-sha.js')

const cases = [
  // unknown host
  ['git+ssh://git@some-host:user/repo', 'sha', 'git+ssh://git@some-host:user/repo#sha'],
  ['git+ssh://git@some-host:user/repo#othersha', 'sha', 'git+ssh://git@some-host:user/repo#sha'],
  ['git+ssh://git@some-host:user/repo#othersha#otherothersha',
    'sha',
    'git+ssh://git@some-host:user/repo#sha'],
  ['git+ssh://git@some-host/user/repo', 'sha', 'git+ssh://git@some-host/user/repo#sha'],
  ['git+ssh://git@some-host/user/repo#othersha', 'sha', 'git+ssh://git@some-host/user/repo#sha'],
  ['git+ssh://git@some-host/user/repo#othersha#otherothersha',
    'sha',
    'git+ssh://git@some-host/user/repo#sha'],
  // github shorthand
  ['github:user/repo', 'sha', 'github:user/repo#sha'],
  ['github:user/repo#othersha', 'sha', 'github:user/repo#sha'],
  ['github:user/repo#othersha#otherothersha', 'sha', 'github:user/repo#sha'],
  // github https with auth
  ['git+https://git@github.com/user/repo', 'sha', 'https://git@github.com/user/repo.git#sha'],
  ['git+https://git@github.com/user/repo#othersha',
    'sha',
    'https://git@github.com/user/repo.git#sha'],
  ['git+https://git@github.com/user/repo#othersha#otherothersha',
    'sha',
    'https://git@github.com/user/repo.git#sha'],
  // github https no auth
  ['git+https://github.com/user/repo', 'sha', 'https://github.com/user/repo.git#sha'],
  ['git+https://github.com/user/repo#othersha', 'sha', 'https://github.com/user/repo.git#sha'],
  ['git+https://github.com/user/repo#othersha#otherothersha', 'sha', 'https://github.com/user/repo.git#sha'],
  // github ssh
  ['git+ssh://git@github.com/user/repo', 'sha', 'github:user/repo#sha'],
  ['git+ssh://git@github.com/user/repo#othersha', 'sha', 'github:user/repo#sha'],
  ['git+ssh://git@github.com/user/repo#othersha#otherothersha', 'sha', 'github:user/repo#sha'],
  ['git+ssh://git@github.com:user/repo', 'sha', 'github:user/repo#sha'],
  ['git+ssh://git@github.com:user/repo#othersha', 'sha', 'github:user/repo#sha'],
  ['git+ssh://git@github.com:user/repo#othersha#otherothersha', 'sha', 'github:user/repo#sha'],
  // repository subdirectory selectors survive the committish swap
  ['git+ssh://git@some-host/user/repo#othersha::path:packages/a',
    'sha',
    'git+ssh://git@some-host/user/repo#sha::path:packages/a'],
  ['git+ssh://git@some-host:user/repo#othersha::path:packages/a',
    'sha',
    'git+ssh://git@some-host:user/repo#sha::path:packages/a'],
  ['github:user/repo#othersha::path:packages/a', 'sha', 'github:user/repo#sha::path:packages/a'],
  ['git+https://git@github.com/user/repo#othersha::path:packages/a',
    'sha',
    'https://git@github.com/user/repo.git#sha::path:packages/a'],
  ['git+https://github.com/user/repo#othersha::path:packages/a',
    'sha',
    'https://github.com/user/repo.git#sha::path:packages/a'],
  ['git+ssh://git@github.com/user/repo#othersha::path:packages/a',
    'sha',
    'github:user/repo#sha::path:packages/a'],
  // a subdirectory paired with a semver range instead of a committish
  ['git+ssh://git@some-host/user/repo#semver:^1.0.0::path:packages/a',
    'sha',
    'git+ssh://git@some-host/user/repo#sha::path:packages/a'],
  ['github:user/repo#semver:^1.0.0::path:packages/a', 'sha', 'github:user/repo#sha::path:packages/a'],
  // nested subdirectories keep every segment
  ['github:user/repo#othersha::path:packages/scope/plugin',
    'sha',
    'github:user/repo#sha::path:packages/scope/plugin'],
]

t.test('matches expected committish-stripping results', t => {
  t.plan(cases.length)
  for (const [spec, sha, result] of cases) {
    t.equal(addGitSha(npa(spec), sha), result, `${spec} + ${sha} = ${result}`)
  }
})

t.test('resolved subdirectory specs round trip back through npa', t => {
  const specs = [
    'git+ssh://git@some-host/user/repo#main::path:packages/a',
    'github:user/repo#main::path:packages/a',
    'git+https://git@github.com/user/repo#main::path:packages/a',
    'git+https://github.com/user/repo#main::path:packages/a',
    'git+ssh://git@github.com/user/repo#main::path:packages/scope/plugin',
  ]
  t.plan(specs.length * 2)
  for (const spec of specs) {
    const parsed = npa(spec)
    const resolved = npa(addGitSha(parsed, 'sha'))
    t.equal(resolved.gitSubdir, parsed.gitSubdir, `${spec} keeps its subdirectory`)
    t.equal(resolved.gitCommittish, 'sha', `${spec} resolves to the new sha`)
  }
})

t.test('leaves specs without a subdirectory untouched', t => {
  // a plain object exercises the non-hosted branch with no gitSubdir at all
  const spec = { hosted: null, rawSpec: 'git+ssh://git@some-host/user/repo#main' }
  t.equal(addGitSha(spec, 'sha'), 'git+ssh://git@some-host/user/repo#sha')
  t.end()
})

t.test('accepts a subdirectory that was not normalized by npa', t => {
  // npa always stores gitSubdir with a leading slash, but a hand built spec
  // should not have its first path segment truncated
  const spec = {
    hosted: null,
    rawSpec: 'git+ssh://git@some-host/user/repo#main',
    gitSubdir: 'packages/a',
  }
  t.equal(addGitSha(spec, 'sha'), 'git+ssh://git@some-host/user/repo#sha::path:packages/a')
  t.end()
})

t.test('strips committish from a malicious rawSpec without catastrophic backtracking (CVE-2026-9496)', t => {
  // a plain object exercises the non-hosted branch directly. the `\n` + trailing
  // char make this rawSpec pathological for the old `/#.*$/` regex (O(n^2)
  // backtracking from every `#`), but it stays linear for indexOf/slice
  const base = 'git+ssh://git@some-host/user/repo'
  const spec = { hosted: null, rawSpec: `${base}${'#'.repeat(1e5)}\nx` }
  const start = process.hrtime.bigint()
  const result = addGitSha(spec, 'sha')
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6
  t.equal(result, `${base}#sha`, 'strips everything from the first committish')
  t.ok(elapsedMs < 1000, `completes quickly (took ${elapsedMs.toFixed(1)}ms)`)
  t.end()
})
