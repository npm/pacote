const t = require('tap')
const { lazySigstore } = require('../lib/lazy')

t.test('lazySigstore', t => {
  t.strictEqual(require('sigstore'), lazySigstore())
  t.end()
})
