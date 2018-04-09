'use strict'

const figgyPudding = require('figgy-pudding')
const pkg = require('../../package.json')
const silentlog = require('./silentlog')

const AUTH_REGEX = /^(?:.*:)?(token|_authToken|username|_password|password|email|always-auth|_auth|otp)$/
const SCOPE_REGISTRY_REGEX = /@.*:registry$/gi
module.exports = figgyPudding({
  annotate: {},
  auth: {},
  defaultTag: 'tag',
  dirPacker: {},
  fullMetadata: 'full-metadata',
  'full-metadata': {
    default: false
  },
  includeDeprecated: {
    default: true
  },
  memoize: {},
  preferOnline: 'prefer-online',
  preferOffline: 'prefer-offline',
  resolved: {},
  scopeTargets: {
    default: {}
  },
  tag: {
    default: 'latest'
  },
  where: {},

  uid: {},
  gid: {},
  dmode: {},
  fmode: {},
  umask: {},
  agent: {},
  algorithms: {
    default: ['sha1']
  },
  body: {},
  ca: {},
  cache: {},
  cert: {},
  'fetch-retries': {},
  'fetch-retry-factor': {},
  'fetch-retry-maxtimeout': {},
  'fetch-retry-mintimeout': {},
  headers: {},
  integrity: {},
  'is-from-ci': 'isFromCI',
  isFromCI: {
    default () {
      return (
        process.env['CI'] === 'true' ||
        process.env['TDDIUM'] ||
        process.env['JENKINS_URL'] ||
        process.env['bamboo.buildKey'] ||
        process.env['GO_PIPELINE_NAME']
      )
    }
  },
  key: {},
  'local-address': {},
  localAddress: 'local-address',
  log: {
    default: silentlog
  },
  maxSockets: 'maxsockets',
  'max-sockets': 'maxsockets',
  maxsockets: {
    default: 12
  },
  method: {
    default: 'GET'
  },
  noProxy: 'noproxy',
  noproxy: {},
  'npm-session': 'npmSession',
  npmSession: {},
  offline: {},
  otp: {},
  'prefer-offline': {},
  'prefer-online': {},
  projectScope: {},
  'project-scope': 'projectScope',
  Promise: {},
  proxy: {},
  query: {},
  refer: {},
  referer: 'refer',
  registry: {
    default: 'https://registry.npmjs.org/'
  },
  retry: {},
  scope: {},
  spec: {},
  strictSSL: 'strict-ssl',
  'strict-ssl': {},
  timeout: {},
  userAgent: 'user-agent',
  'user-agent': {
    default: `${
      pkg.name
    }@${
      pkg.version
    }/node@${
      process.version
    }+${
      process.arch
    } (${
      process.platform
    })`
  }
}, {
  other (key) {
    return key.match(AUTH_REGEX) || key.match(SCOPE_REGISTRY_REGEX)
  }
})
