'use strict'

const tar = require('tar')

module.exports = extractStream
function extractStream (dest, opts, cb) {
  opts = opts || {}
  return tar.x({
    cwd: dest,
    filter: (name, entry) => !entry.header.type.match(/^.*link$/i),
    strip: 1,
    onwarn: msg => opts.log && opts.log.warn('tar', msg),
    onentry: makeOnEntry(opts),
    preserveOwner: opts.uid != null || opts.gid != null
  })
}

function makeOnEntry (opts) {
  const sawEntry = {}
  return entry => _onentry(entry, sawEntry, opts)
}

function _onentry (entry, sawIgnores, opts) {
  if (process.getuid) {
    entry.uid = opts.uid == null ? entry.uid : opts.uid
    entry.gid = opts.gid == null ? entry.gid : opts.gid
  }
  if (entry.type.toLowerCase() === 'file') {
    entry.mode = opts.fmode & ~(opts.umask || 0)
  } else if (entry.type.toLowerCase() === 'directory') {
    entry.mode = opts.dmode & ~(opts.umask || 0)
  }
}
