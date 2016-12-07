var nock = require('nock')

module.exports = tnock
function tnock (t, host) {
  var server = nock(host)
  t.tearDown(function () { server.done() })
  return server
}
