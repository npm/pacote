const which = require('which')

let gitPath
try {
  gitPath = which.sync('git')
} catch (e) {}

module.exports = (opts = {}) => opts.git || gitPath || null
