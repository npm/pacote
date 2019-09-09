const spawn = require('./spawn.js')
module.exports = (localRepo, opts) => spawn([
  'submodule',
  'update',
  '-q',
  '--init',
  '--recursive'
], { cwd: localRepo }, opts)
