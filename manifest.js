var optCheck = require('./lib/util/opt-check')
var rps = require('realize-package-specifier')

module.exports = manifest
function manifest (spec, opts, cb) {
  if (!cb) {
    cb = opts
    opts = null
  }
  opts = optCheck(opts)

  rps(spec, function (err, res) {
    if (err) { return cb(err) }
    // The registry module takes care of both of these.
    var type = (res.type === 'tag' || res.type === 'version')
    ? 'registry'
    : type
    var fetcher = require('./lib/' + type + '/manifest')
    fetcher(res, opts, cb)
  })
}
