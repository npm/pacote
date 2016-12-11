var semver = require('semver')

module.exports = pickManifest
function pickManifest (metadata, range, opts, cb) {
  var distTags = metadata['dist-tags'] || {}
  var versions = Object.keys(metadata.versions || {})
  var err

  if (!versions.length) {
    err = new Error('Package has no versions.')
    err.code = 'ENOVERSIONS'
    err.name = metadata.name
    err.range = range
    return cb(err)
  }

  if (opts.engineFilter && (opts.engineFilter.node || opts.engineFilter.npm)) {
    versions = filterByEngines(metadata, versions, opts.engineFilter)
  }

  var tagVersion = distTags[opts.defaultTag || 'latest']
  var target

  if (tagVersion &&
      metadata.versions[tagVersion] &&
      semver.satisfies(tagVersion, range, true)) {
    target = tagVersion
  }

  if (!target) {
    target = semver.maxSatisfying(versions, range, true)
  }

  if (!target && range === '*') {
    // npm hard-codes `latest` here, but it's likely intended
    // to be `defaultTag`.
    //
    // This specific corner is meant for the case where
    // someone is using `*` as a selector, but all versions
    // are pre-releases, which don't match ranges at all.
    target = tagVersion
  }

  var manifest = target && metadata.versions[target]
  if (!manifest) {
    err = new Error('No matching versions')
    err.code = 'ENOENT'
    err.name = metadata.name
    err.range = range
    err.versions = versions
    err.distTags = distTags
    err.defaultTag = opts.defaultTag
    return cb(err)
  } else {
    return cb(null, manifest)
  }
}

function filterByEngines (metadata, versions, engFilter) {
  return versions.filter(function (v) {
    var eng = metadata.versions[v].engines
    return !eng || (
      (!eng.node || semver.satisfies(engFilter.node, eng.node, true)) &&
      (!eng.npm || semver.satisfies(engFilter.npm, eng.npm, true))
    )
  })
}
