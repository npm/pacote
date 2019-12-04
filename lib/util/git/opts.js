const gitEnv = require('./env.js')
module.exports = (_gitOpts = {}, opts = {}) => {
  const isRoot = process.getuid && process.getuid() === 0
  const gitOpts = {
    env: gitEnv()
  }
  if (isRoot && +opts.uid && !isNaN(opts.uid)) {
    gitOpts.uid = +opts.uid
  }
  if (isRoot && +opts.gid && !isNaN(opts.gid)) {
    gitOpts.gid = +opts.gid
  }
  Object.assign(gitOpts, _gitOpts)
  return gitOpts
}
