'use strict'

var BB = require('bluebird')

var semver = require('semver')

module.exports = pickManifest
function pickManifest (metadata, spec, opts) {
  var distTags = metadata['dist-tags'] || {}
  var versions = Object.keys(metadata.versions || {})
  versions = versions.filter(function (v) { return semver.valid(v) })
  var err
  return BB.fromNode(cb => {
    if (!versions.length) {
      err = new Error(`No valid versions available for ${metadata.name}`)
      err.code = 'ENOVERSIONS'
      err.name = metadata.name
      err.spec = spec
      return cb(err)
    }

    var target

    if (spec.type === 'tag') {
      target = distTags[spec.fetchSpec]
    } else if (spec.type === 'version') {
      target = spec.fetchSpec
    } else if (spec.type !== 'range') {
      return cb(new Error('Only tag, version, and range are supported'))
    }

    var tagVersion = distTags[opts.defaultTag || 'latest']

    if (
      !target &&
      tagVersion &&
      metadata.versions[tagVersion] &&
      semver.satisfies(tagVersion, spec.fetchSpec, true)
    ) {
      target = tagVersion
    }

    if (!target) {
      target = semver.maxSatisfying(versions, spec.fetchSpec, true)
    }

    if (!target && spec.fetchSpec === '*') {
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
      err = new Error(`No matching version found for ${spec.name}@${spec.fetchSpec}`)
      err.code = 'ETARGET'
      err.name = metadata.name
      err.spec = spec
      err.versions = versions
      err.distTags = distTags
      err.defaultTag = opts.defaultTag
      return cb(err)
    } else {
      return cb(null, manifest)
    }
  })
}
