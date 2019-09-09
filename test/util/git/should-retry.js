const shouldRetry = require('../../../lib/util/git/should-retry.js')
const t = require('tap')
t.ok(shouldRetry('SSL_ERROR_SYSCALL', 1), 'transient error, not beyond max')
t.notOk(shouldRetry('asdf', 1), 'unknown error, do not retry')
t.notOk(shouldRetry('Failed to connect to fooblz Timed out', 69),
  'beyond max retries, do not retry')
