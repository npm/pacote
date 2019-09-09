const gitEnv = require('./env.js')
module.exports = (_gitOpts = {}, opts = {}) => {
  const gitOpts = {
    env: gitEnv()
  }
  if (+opts.uid && !isNaN(opts.uid)) {
    gitOpts.uid = +opts.uid
  }
  if (+opts.gid && !isNaN(opts.gid)) {
    gitOpts.gid = +opts.gid
  }
  Object.assign(gitOpts, _gitOpts)
  return gitOpts
}
