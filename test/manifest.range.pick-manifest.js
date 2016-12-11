var test = require('tap').test

var pickManifest = require('../lib/handlers/range/pick-manifest')

test('basic carat range selection', function (t) {
  var metadata = {
    versions: {
      '1.0.0': { version: '1.0.0' },
      '1.0.1': { version: '1.0.1' },
      '1.0.2': { version: '1.0.2' },
      '2.0.0': { version: '2.0.0' }
    }
  }
  pickManifest(metadata, '^1.0.0', {}, function (err, manifest) {
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
  pickManifest(metadata, '~1.0.0', {}, function (err, manifest) {
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
  pickManifest(metadata, '>=1.0.0 <2', {}, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '1.0.2', 'picked the right manifest using mathematical range')
    t.end()
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
  pickManifest(metadata, '^2.1.0', {}, function (err, manifest) {
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
  pickManifest(metadata, '^1.0.0', {
    defaultTag: 'foo'
  }, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '1.0.1', 'picked the version for foo')
  })
  pickManifest(metadata, '^2.0.0', {
    defaultTag: 'foo'
  }, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '2.0.0', 'no match, no foo')
  })
  pickManifest(metadata, '^1.0.0', {}, function (err, manifest) {
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
  pickManifest(metadata, '*', {
    defaultTag: 'beta'
  }, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '2.0.0-beta.0', 'used defaultTag for all-prerelease splat.')
  })
  pickManifest(metadata, '*', {}, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '1.0.0-pre.0', 'defaulted to `latest`.')
  })
})

test('errors if metadata has no versions', function (t) {
  t.plan(4)
  pickManifest({versions: {}}, '^1.0.0', {}, function (err) {
    t.ok(err, 'got an error')
    t.equal(err.code, 'ENOVERSIONS', 'useful error code')
  })
  pickManifest({}, '^1.0.0', {}, function (err) {
    t.ok(err, 'got an error')
    t.equal(err.code, 'ENOVERSIONS', 'useful error code')
  })
})

test('optionally filters by engines', function (t) {
  var metadata = {
    versions: {
      '1.0.0': { version: '1.0.0' },
      '1.0.1': { version: '1.0.1' },
      '1.0.2': { version: '1.0.2', engines: { node: '^1.0.0' } },
      '2.0.0': { version: '2.0.0' },
      '2.0.1': { version: '2.0.1' },
      '2.0.2': { version: '2.0.2', engines: { npm: '^1.0.0' } }
    }
  }
  t.plan(4)
  pickManifest(metadata, '^1.0.0', {
    engineFilter: { node: '2.0.0' }
  }, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '1.0.1', 'disqualified non-matching node')
  })
  pickManifest(metadata, '^2.0.0', {
    engineFilter: { npm: '2.0.0' }
  }, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '2.0.1', 'disqualified non-matching npm')
  })
  pickManifest(metadata, '^2.0.0', {}, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '2.0.2', 'no filter, no problem')
  })
  pickManifest(metadata, '^2.0.0', {
    engineFilter: {}
  }, function (err, manifest) {
    if (err) { throw err }
    t.equal(manifest.version, '2.0.2', 'empty filter, no problem')
  })
})
