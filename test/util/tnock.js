var nock = require('nock')
var manifestCache = require('../../lib/cache/manifest')

module.exports = tnock
function tnock (t, host) {
  manifestCache._clearMemoized()
  var server = nock(host)
  t.tearDown(function () {
    server.done()
  })
  return server
}
