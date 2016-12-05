var optCheck = require('./lib/util/opt-check')
var rps = require('realize-package-specifier')

module.exports = metadata
function metadata (spec, opts, cb) {
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
    var fetcher = require('./lib/' + type + '/metadata')
    fetcher(res, opts, cb)
  })
}
