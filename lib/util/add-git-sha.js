// a repository subdirectory selector lives in the committish string, so it has
// to be re-attached to the resolved sha or it is dropped along with the old ref.
// npm-package-arg stores it with a leading slash, which the spec syntax omits.
const gitSubdirSuffix = (spec) => {
  const subdir = spec.gitSubdir
  if (!subdir) {
    return ''
  }
  return `::path:${subdir.startsWith('/') ? subdir.slice(1) : subdir}`
}

// add a sha to a git remote url spec
const addGitSha = (spec, sha) => {
  const subdir = gitSubdirSuffix(spec)
  if (spec.hosted) {
    const h = spec.hosted
    const opt = { noCommittish: true }
    const base = h.https && (h.auth || h.default === 'https') ? h.https(opt) : h.shortcut(opt)

    return `${base}#${sha}${subdir}`
  } else {
    // don't use new URL for this, because it doesn't handle scp urls
    // strip the committish with indexOf/slice to avoid a regexp redos
    const hashIndex = spec.rawSpec.indexOf('#')
    const base = hashIndex === -1 ? spec.rawSpec : spec.rawSpec.slice(0, hashIndex)
    return `${base}#${sha}${subdir}`
  }
}

module.exports = addGitSha
