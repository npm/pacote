var silentlog = require('./silentlog')

function PacoteOptions (opts) {
  this._isPacoteOptions = true
  this.log = opts.log || silentlog
  this.registry = opts.registry || 'https://registry.npmjs.org'
  this.auth = opts.auth
  this.cache = opts.cache
  this.cacheUid = opts.cacheUid
  this.cacheGid = opts.cacheGid
  this.uid = opts.uid
  this.gid = opts.gid
  this.scope = opts.scope
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
