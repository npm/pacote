const spawn = require('./spawn.js')
const headSha = require('./head-sha.js')
const updateSubmodules = require('./update-submodules.js')

module.exports = (repo, branch, target, opts) => {
  const gitArgs = ['clone', '--depth=1', '-q']
  if (branch)
    gitArgs.push('-b', branch)

  gitArgs.push(repo, target)

  if (process.platform === 'win32')
    gitArgs.push('--config', 'core.longpaths=true')

  return spawn(gitArgs, { cwd: target }, opts)
    .then(() => updateSubmodules(target, opts))
    .then(() => headSha(target, opts))
}
