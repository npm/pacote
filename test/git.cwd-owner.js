'use strict'
const t = require('tap')

process.getuid = () => 0
process.getgid = () => 0

const requireInject = require('require-inject')
const fs = require('fs')
const { _cwdOwner: cwdOwner } = requireInject('../lib/util/git.js', {
  fs: Object.assign({}, fs, {
    lstat: (path, cb) => {
      if (path === '/var/root/.npm/_cacache/bleep/boop') {
        return process.nextTick(() => cb(null, { uid: 0, gid: 0 }))
      }
      if (path === '/home/user/.npm/_cacache/bleep/boop') {
        return process.nextTick(() => cb(null, { uid: 69, gid: 420 }))
      }
      fs.lstat(path, cb)
    },
    stat: (path, cb) => {
      if (path === '/var/root/.npm/_cacache/bleep/boop') {
        return process.nextTick(() => cb(null, { uid: 0, gid: 0 }))
      }
      if (path === '/home/user/.npm/_cacache/bleep/boop') {
        return process.nextTick(() => cb(null, { uid: 69, gid: 420 }))
      }
      fs.stat(path, cb)
    }
  })
})

t.test('running in root-owned folder, but with non-root uid/gid opts', t => {
  const gitOpts = {
    cwd: '/var/root/.npm/_cacache/bleep/boop'
  }
  const opts = {
    uid: 69,
    gid: 420
  }
  return cwdOwner(gitOpts, opts).then(() => {
    t.strictSame(gitOpts, {
      cwd: '/var/root/.npm/_cacache/bleep/boop',
      uid: 0,
      gid: 0
    })
  })
})

t.test('running in non-root-owned folder', t => {
  const gitOpts = {
    cwd: '/home/user/.npm/_cacache/bleep/boop'
  }
  const opts = {
    uid: 12,
    gid: 34
  }
  return cwdOwner(gitOpts, opts).then(() => {
    t.strictSame(gitOpts, {
      cwd: '/home/user/.npm/_cacache/bleep/boop',
      uid: 69,
      gid: 420
    })
  })
})

t.test('running without a cwd', t => {
  const gitOpts = {}
  const opts = {
    uid: 12,
    gid: 34
  }
  return cwdOwner(gitOpts, opts).then(() => {
    t.strictSame(gitOpts, {})
  })
})
