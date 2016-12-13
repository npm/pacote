var CLIENT
var CLIENT_OPTS

module.exports = client
function client (opts) {
  if (!CLIENT ||
      CLIENT_OPTS.log !== opts.log ||
      CLIENT_OPTS.retry !== opts.retry) {
    var RegistryClient = require('npm-registry-client')
    CLIENT_OPTS = {
      log: opts.log,
      retry: opts.retry
    }
    CLIENT = new RegistryClient(CLIENT_OPTS)
  }
  return CLIENT
}
