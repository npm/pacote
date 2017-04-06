'use strict'

var silentlog = require('./silentlog')

function PacoteOptions (opts) {
  opts = opts || {}
  this._isPacoteOptions = true
  this.agent = opts.agent
  this.annotate = opts.annotate
  this.auth = opts.auth
  this.scopeTargets = opts.scopeTargets || {}
  this.defaultTag = opts.defaultTag || 'latest'
  this.cache = opts.cache
  this.integrity = opts.integrity
  this.engineFilter = opts.engineFilter
  this.log = opts.log || silentlog
  this.maxSockets = opts.maxSockets || 10
  this.offline = opts.offline
  this.preferOffline = opts.preferOffline
  this.proxy = opts.proxy
  this.registry = opts.registry || 'https://registry.npmjs.org'
  this.retry = opts.retry // for npm-registry-client
  this.scope = opts.scope
  this.where = opts.where
  this.preferOnline = opts.preferOnline

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
