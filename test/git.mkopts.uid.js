'use strict'
const t = require('tap')
const { _mkOpts: mkOpts } = require('../lib/util/git.js')
const getuid = process.getuid

t.test('mkOpts sets perms when root', t => {
  t.teardown(() => {
    process.getuid = getuid
  })
  process.getuid = () => 0
  t.match(mkOpts({}, { uid: 1234, gid: 1234 }), { uid: 1234, gid: 1234 })
  t.end()
})

t.test('mkOpts does not set perms when not root', t => {
  t.teardown(() => {
    process.getuid = getuid
  })
  process.getuid = () => 4321
  t.match(mkOpts({}, { uid: 1234, gid: 1234 }), { uid: undefined, gid: undefined })
  t.end()
})
