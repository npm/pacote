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
  ['git+https://github.com/user/repo', 'sha', 'github:user/repo#sha'],
  ['git+https://github.com/user/repo#othersha', 'sha', 'github:user/repo#sha'],
  ['git+https://github.com/user/repo#othersha#otherothersha', 'sha', 'github:user/repo#sha'],
  // github ssh
  ['git+ssh://git@github.com/user/repo', 'sha', 'github:user/repo#sha'],
  ['git+ssh://git@github.com/user/repo#othersha', 'sha', 'github:user/repo#sha'],
  ['git+ssh://git@github.com/user/repo#othersha#otherothersha', 'sha', 'github:user/repo#sha'],
  ['git+ssh://git@github.com:user/repo', 'sha', 'github:user/repo#sha'],
  ['git+ssh://git@github.com:user/repo#othersha', 'sha', 'github:user/repo#sha'],
  ['git+ssh://git@github.com:user/repo#othersha#otherothersha', 'sha', 'github:user/repo#sha'],
]

t.test('matches expected committish-stripping results', t => {
  t.plan(cases.length)
  for (const [spec, sha, result] of cases) {
    t.equal(addGitSha(npa(spec), sha), result, `${spec} + ${sha} = ${result}`)
  }
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
