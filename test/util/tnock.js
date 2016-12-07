var nock = require('nock')
var regManifest = require('../../lib/registry/manifest')

module.exports = tnock
function tnock (t, host) {
  var server = nock(host)
  t.tearDown(function () {
    server.done()
    regManifest._clearMemoized()
  })
  return server
}
