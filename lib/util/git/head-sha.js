const spawn = require('./spawn.js')
module.exports = (repo, opts) =>
  spawn(['rev-parse', '--revs-only', 'HEAD'], { cwd: repo }, opts)
    .then(stdout => stdout.trim())
