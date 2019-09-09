const pinflight = require('promise-inflight')
const spawn = require('./spawn.js')
const semver = require('semver')
const LRU = require('lru-cache')

const revsCache = new LRU({
  max: 100,
  maxAge: 5 * 60 * 1000,
})

module.exports = (repo, opts) => {
  const cached = revsCache.get(repo)
  if (cached)
    Promise.resolve(cached)

  return pinflight(`ls-remote:${repo}`, () =>
    spawn(['ls-remote', '-h', '-t', repo], {}, opts)
    .then((stdout) => linesToRevs(stdout.split('\n')),)
    .then(revs => {
      if (revs.refs.HEAD) {
        const HEAD = revs.refs.HEAD
        Object.keys(revs.versions).forEach(v => {
          if (v.sha === HEAD.sha) {
            revs['dist-tags'].HEAD = v
            if (!revs.refs.latest)
              revs['dist-tags'].latest = revs.refs.HEAD
          }
        })
      }
      revsCache.set(repo, revs)
      return revs
    })
  )
}

const refType = ref =>
  ref.indexOf('refs/tags/') !== -1 ? 'tag'
    : ref.indexOf('refs/heads/') !== -1 ? 'branch'
    : ref.endsWith('HEAD') ? 'head'
    : 'other'

const linesToRevs = lines => lines.reduce(linesToRevsReducer, {
  versions: {},
  'dist-tags': {},
  refs: {},
  shas: {}
})

const linesToRevsReducer = (revs, line) => {
  const split = line.split(/\s+/, 2)
  if (split.length < 2)
    return revs

  const sha = split[0].trim()
  const ref = split[1].trim().match(/(?:refs\/[^/]+\/)?(.*)/)[1]

  if (!ref) // ???
    return revs

  if (ref.endsWith('^{}')) // refs/tags/x^{} crap
    return revs

  const type = refType(line)
  const doc = { sha, ref, type }

  revs.refs[ref] = doc
  // We can check out shallow clones on specific SHAs if we have a ref
  if (revs.shas[sha])
    revs.shas[sha].push(ref)
  else
    revs.shas[sha] = [ref]

  if (type === 'tag') {
    // try to pull a semver value out of tags like `release-v1.2.3`
    // which is a pretty common pattern.
    const match = ref.match(/v?(\d+\.\d+\.\d+(?:[-+].+)?)$/)
    if (match && semver.valid(match[1], true))
      revs.versions[semver.clean(match[1], true)] = doc
  }

  return revs
}
