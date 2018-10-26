'use strict'
const test = require('tap').test
const computeMode = require('../lib/extract-stream.js')._computeMode

const tests = {
  'same': { umask: 0o022, entryMode: 0o755, optMode: 0o755, result: 0o755 },
  'opt high': { umask: 0o022, entryMode: 0o755, optMode: 0o777, result: 0o755 },
  'entry high': { umask: 0o022, entryMode: 0o777, optMode: 0o755, result: 0o755 },
  'opt low': { umask: 0o022, entryMode: 0o000, optMode: 0o400, result: 0o400 },
  'entry low': { umask: 0o022, entryMode: 0o400, optMode: 0o000, result: 0o400 }
}

test('computeMode', t => {
  Object.keys(tests).forEach(label => {
    const data = tests[label]
    t.is(computeMode(data.entryMode, data.optMode, data.umask), data.result, label)
  })
  t.done()
})
