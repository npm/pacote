var test = require('tap').test

var pickManifest = require('../lib/registry/pick-manifest')

function spec (selector, type) {
  return { spec: selector, type: type || 'range' }
}

test('basic carat range selection', function (t) {
  var metadata = {
    versions: {
      '1.0.0': { version: '1.0.0' },
      '1.0.1': { version: '1.0.1' },
      '1.0.2': { version: '1.0.2' },
      '2.0.0': { version: '2.0.0' }
    }
  }
  pickManifest(metadata, spec('^1.0.0'), {}, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '1.0.2', 'picked the right manifest using ^')
    t.end()
  })
})

test('basic tilde range selection', function (t) {
  var metadata = {
    versions: {
      '1.0.0': { version: '1.0.0' },
      '1.0.1': { version: '1.0.1' },
      '1.0.2': { version: '1.0.2' },
      '2.0.0': { version: '2.0.0' }
    }
  }
  pickManifest(metadata, spec('~1.0.0'), {}, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '1.0.2', 'picked the right manifest using ~')
    t.end()
  })
})

test('basic mathematical range selection', function (t) {
  var metadata = {
    versions: {
      '1.0.0': { version: '1.0.0' },
      '1.0.1': { version: '1.0.1' },
      '1.0.2': { version: '1.0.2' },
      '2.0.0': { version: '2.0.0' }
    }
  }
  pickManifest(metadata, spec('>=1.0.0 <2'), {}, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '1.0.2', 'picked the right manifest using mathematical range')
    t.end()
  })
})

test('basic version selection', function (t) {
  var metadata = {
    versions: {
      '1.0.0': { version: '1.0.0' },
      '1.0.1': { version: '1.0.1' },
      '1.0.2': { version: '1.0.2' },
      '2.0.0': { version: '2.0.0' }
    }
  }
  pickManifest(metadata, spec('1.0.0', 'version'), {
  }, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '1.0.0', 'picked the right manifest using specific version')
    t.end()
  })
})

test('basic tag selection', function (t) {
  var metadata = {
    'dist-tags': {
      foo: '1.0.1'
    },
    versions: {
      '1.0.0': { version: '1.0.0' },
      '1.0.1': { version: '1.0.1' },
      '1.0.2': { version: '1.0.2' },
      '2.0.0': { version: '2.0.0' }
    }
  }
  pickManifest(metadata, spec('foo', 'tag'), {}, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '1.0.1', 'picked the right manifest using tag')
    t.end()
  })
})

test('errors if a non-registry spec is provided', function (t) {
  var metadata = {
    'dist-tags': {
      foo: '1.0.1'
    },
    versions: {
      '1.0.1': { version: '1.0.1' }
    }
  }
  pickManifest(metadata, {spec: 'foo', type: 'uhhh'}, {}, function (err) {
    t.ok(err, 'errored on bad spec type')
    t.match(err.message, /Only tag, version, and range are supported/)
    t.end()
  })
})

test('skips any invalid version keys', function (t) {
  // Various third-party registries are prone to having trash as
  // keys. npm simply skips them. Yay robustness.
  var metadata = {
    versions: {
      '1.0.0': { version: '1.0.0' },
      'lol ok': { version: '1.0.1' }
    }
  }
  t.plan(4)
  pickManifest(metadata, spec('^1.0.0'), {}, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '1.0.0', 'avoided bad key')
  })
  pickManifest(metadata, spec('^1.0.1'), {}, function (err, manifest) {
    t.notOk(manifest, 'no manifest returned')
    t.ok(err, 'got an error')
    t.equal(err.code, 'ENOENT', 'no matching specs')
  })
})

test('ENOENT if range does not match anything', function (t) {
  var metadata = {
    versions: {
      '1.0.0': { version: '1.0.0' },
      '2.0.0': { version: '2.0.0' },
      '2.0.5': { version: '2.0.5' }
    }
  }
  pickManifest(metadata, spec('^2.1.0'), {}, function (err, manifest) {
    t.ok(err, 'got an error')
    t.equal(err.code, 'ENOENT', 'useful error code returned.')
    t.notOk(manifest, 'no manifest returned.')
    t.end()
  })
})
test('if `defaultTag` matches a given range, use it', function (t) {
  var metadata = {
    'dist-tags': {
      foo: '1.0.1',
      latest: '1.0.0'
    },
    versions: {
      '1.0.0': { version: '1.0.0' },
      '1.0.1': { version: '1.0.1' },
      '1.0.2': { version: '1.0.2' },
      '2.0.0': { version: '2.0.0' }
    }
  }
  t.plan(3)
  pickManifest(metadata, spec('^1.0.0'), {
    defaultTag: 'foo'
  }, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '1.0.1', 'picked the version for foo')
  })
  pickManifest(metadata, spec('^2.0.0'), {
    defaultTag: 'foo'
  }, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '2.0.0', 'no match, no foo')
  })
  pickManifest(metadata, spec('^1.0.0'), {}, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '1.0.0', 'default to `latest`')
  })
})

test('* ranges use `defaultTag` if no versions match', function (t) {
  var metadata = {
    'dist-tags': {
      latest: '1.0.0-pre.0',
      beta: '2.0.0-beta.0'
    },
    versions: {
      '1.0.0-pre.0': { version: '1.0.0-pre.0' },
      '1.0.0-pre.1': { version: '1.0.0-pre.1' },
      '2.0.0-beta.0': { version: '2.0.0-beta.0' },
      '2.0.0-beta.1': { version: '2.0.0-beta.1' }
    }
  }
  t.plan(2)
  pickManifest(metadata, spec('*'), {
    defaultTag: 'beta'
  }, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '2.0.0-beta.0', 'used defaultTag for all-prerelease splat.')
  })
  pickManifest(metadata, spec('*'), {}, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '1.0.0-pre.0', 'defaulted to `latest`.')
  })
})

test('errors if metadata has no versions', function (t) {
  t.plan(4)
  pickManifest({versions: {}}, spec('^1.0.0'), {}, function (err) {
    t.ok(err, 'got an error')
    t.equal(err.code, 'ENOVERSIONS', 'useful error code')
  })
  pickManifest({}, spec('^1.0.0'), {}, function (err) {
    t.ok(err, 'got an error')
    t.equal(err.code, 'ENOVERSIONS', 'useful error code')
  })
})
