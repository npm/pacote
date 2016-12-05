var silentlog = require('./silentlog')

function PacoteOptions (opts) {
  this._isPacoteOptions = true
  this.auth = opts.auth
  this.cache = opts.cache
  this.cacheUid = opts.cacheUid
  this.cacheGid = opts.cacheGid
  this.hashAlgorithm = opts.hashAlgorithm || 'sha1'
  this.log = opts.log || silentlog
  this.pkg = opts.pkg
  this.registry = opts.registry || 'https://registry.npmjs.org'
  this.scope = opts.scope

  this.uid = opts.uid
  this.gid = opts.gid

  this.dmode = opts.dmode
  this.fmode = opts.fmode
  this.umask = opts.umask

  Object.keys(opts).forEach(function (k) {
    if (k.match(/:registry$/i)) {
      this[k] = opts[k]
    }
  }, this)
}

module.exports = optCheck
function optCheck (opts) {
  return opts._isPacoteOptions ? opts : new PacoteOptions(opts)
}
