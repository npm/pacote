'use strict'

var silentlog = require('./silentlog')

function PacoteOptions (opts) {
  opts = opts || {}
  this._isPacoteOptions = true
  this.auth = opts.auth
  this.scopeTargets = opts.scopeTargets || {}
  this.defaultTag = opts.defaultTag || 'latest'
  this.cache = opts.cache
  this.cacheUid = opts.cacheUid
  this.cacheGid = opts.cacheGid
  this.digest = opts.digest
  this.engineFilter = opts.engineFilter
  this.hashAlgorithm = opts.hashAlgorithm || 'sha1'
  this.log = opts.log || silentlog
  this.maxAge = typeof opts.maxAge === 'undefined' ? 1000 : opts.maxAge
  this.maxSockets = opts.maxSockets || 10
  this.memoize = !!opts.memoize
  this.offline = opts.offline
  this.pkg = opts.pkg
  this.preferOffline = opts.preferOffline
  this.registry = opts.registry || 'https://registry.npmjs.org'
  this.retry = opts.retry // for npm-registry-client
  this.scope = opts.scope
  this.where = opts.where

  this.gitPacker = opts.gitPacker || null

  this.uid = opts.uid
  this.gid = opts.gid

  this.dmode = opts.dmode
  this.fmode = opts.fmode
  this.umask = opts.umask
}

module.exports = optCheck
function optCheck (opts) {
  return new PacoteOptions(opts)
}
