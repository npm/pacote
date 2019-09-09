const pinflight = require('promise-inflight')
const spawn = require('./spawn.js')
const semver = require('semver')
const LRU = require('lru-cache')

const revsCache = new LRU({
  max: 100,
  maxAge: 5 * 60 * 1000,
})

module.exports = (repo, opts = {}) => {
  if (!opts.noGitRevCache) {
    const cached = revsCache.get(repo)
    if (cached)
      return Promise.resolve(cached)
  }

  return pinflight(`ls-remote:${repo}`, () =>
    spawn(['ls-remote', repo], {}, opts)
    .then(stdout => linesToRevs(stdout.trim().split('\n')))
    .then(revs => {
      // not entirely sure what situations would result in an
      // ichabod repo, but best to be careful in Sleepy Hollow anyway
      const HEAD = revs.refs.HEAD || /* istanbul ignore next */ {}
      const versions = Object.keys(revs.versions)
      versions.forEach(v => {
        // simulate a dist-tags with latest pointing at the
        // 'latest' branch if one exists and is a version,
        // or HEAD if not.
        const ver = revs.versions[v]
        if (revs.refs.latest && ver.sha === revs.refs.latest.sha)
          revs['dist-tags'].latest = v
        else if (ver.sha === HEAD.sha) {
          revs['dist-tags'].HEAD = v
          if (!revs.refs.latest)
            revs['dist-tags'].latest = v
        }
      })
      revsCache.set(repo, revs)
      return revs
    })
  )
}

const refType = ref =>
  ref.indexOf('refs/tags/') !== -1 ? 'tag'
    : ref.indexOf('refs/heads/') !== -1 ? 'branch'
    : ref.endsWith('HEAD') ? 'head'
    // no idea what this would even be, tbh
    : /* istanbul ignore next */ 'other'

const linesToRevs = lines => lines.reduce(linesToRevsReducer, {
  versions: {},
  'dist-tags': {},
  refs: {},
  shas: {}
})

const linesToRevsReducer = (revs, line) => {
  const split = line.split(/\s+/, 2)
  /* istanbul ignore if */
  if (split.length < 2)
    return revs

  const sha = split[0].trim()

  // refs/tags/foo^{} is the 'peeled tag', ie the commit
  // that is tagged by refs/tags/foo they resolve to the same
  // content, just different objects in git's data structure.
  // But, we care about the thing the tag POINTS to, not the tag
  // object itself, so only look at the peeled tag refs, and
  // ignore the pointer.
  const rawRef = split[1].trim().match(/(?:refs\/[^/]+\/)?(.*)/)[1]
  const type = refType(line)
  if (type === 'tag' && !rawRef.endsWith('^{}'))
    return revs
  const ref = rawRef.replace(/\^\{\}$/, '')

  /* istanbul ignore if */
  if (!ref) // ???
    return revs

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
