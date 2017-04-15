'use strict'

const BB = require('bluebird')

module.exports = manifest
function manifest () {
  // The tarball handler will take care of it!
  return BB.resolve(null)
}
