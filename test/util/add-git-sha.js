const t = require('tap')
const npa = require('npm-package-arg')
const addGitSha = require('../../lib/util/add-git-sha.js')

const cases = [
  // unknown host
  ['git+ssh://git@some-host:user/repo', 'sha', 'git+ssh://git@some-host:user/repo#sha'],
  ['git+ssh://git@some-host:user/repo#othersha', 'sha', 'git+ssh://git@some-host:user/repo#sha'],
  [
    'git+ssh://git@some-host:user/repo#othersha#otherothersha',
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

t.plan(cases.length)
for (const [spec, sha, result] of cases) {
  t.equal(addGitSha(npa(spec), sha), result, `${spec} + ${sha} = ${result}`)
}
