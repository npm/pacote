// calls full or shallow based on whether a resolved ref has
// been verified, and if the host is known to support it.
const full = require('./full.js')
const shallow = require('./shallow.js')

// Only certain whitelisted hosts get shallow cloning,
// because some hosts don't support it.
const shallowHosts = new Set([
  'github.com',
  'gist.github.com',
  'gitlab.com',
  'bitbucket.com',
  'bitbucket.org',
])
const { parse } = require('url')

module.exports = (repo, ref, tmp, opts, resolvedRef) =>
  resolvedRef && shallowHosts.has(parse(repo).host)
    ? shallow(repo, ref, tmp, opts)
    : full(repo, ref, tmp, opts)
