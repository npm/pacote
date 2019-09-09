const spawn = require('./spawn.js')
const headSha = require('./head-sha.js')
const updateSubmodules = require('./update-submodules.js')
const { join } = require('path')

module.exports = (repo, committish, target, opts) => {
  const gitArgs = ['clone', '--mirror', '-q', repo, join(target, '.git')]

  if (process.platform === 'win32')
    gitArgs.push('--config', 'core.longpaths=true')

  const checkoutCommit = committish || 'HEAD'
  return spawn(gitArgs, { cwd: target }, opts)
    .then(() => spawn(['init'], { cwd: target }, opts))
    .then(() => spawn(['checkout', checkoutCommit], { cwd: target }, opts))
    .then(() => updateSubmodules(target, opts))
    .then(() => headSha(target, opts))
}
