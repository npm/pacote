var rps = require('realize-package-specifier')

module.exports = manifest
function manifest (spec, opts, cb) {
  if (!cb) {
    cb = opts
    opts = null
  }
  opts = opts || {}

  rps(spec, function (err, res) {
    if (err) { return cb(err) }
    if (res.type === 'range' || res.type === 'directory') {
      var e = new Error('spec type not supported')
      e.type = res.type
      e.code = 'EBADTYPE'
      return cb(e)
    }
    // The registry module takes care of both of these.
    var type = (res.type === 'tag' || res.type === 'version')
    ? 'registry'
    : type
    var fetcher = require('./lib/' + type + '/manifest')
    fetcher(res, opts, cb)
  })
}
