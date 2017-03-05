'use strict'

const BB = require('bluebird')

const test = require('tap').test

const pickManifest = require('../lib/registry/pick-manifest')

function spec (selector, type) {
  return { spec: selector, type: type || 'range' }
}

test('basic carat range selection', t => {
  const metadata = {
    versions: {
      '1.0.0': { version: '1.0.0' },
      '1.0.1': { version: '1.0.1' },
      '1.0.2': { version: '1.0.2' },
      '2.0.0': { version: '2.0.0' }
    }
  }
  return pickManifest(metadata, spec('^1.0.0'), {}).then(manifest => {
    t.equal(manifest.version, '1.0.2', 'picked the right manifest using ^')
  })
})

test('basic tilde range selection', t => {
  const metadata = {
    versions: {
      '1.0.0': { version: '1.0.0' },
      '1.0.1': { version: '1.0.1' },
      '1.0.2': { version: '1.0.2' },
      '2.0.0': { version: '2.0.0' }
    }
  }
  return pickManifest(metadata, spec('~1.0.0'), {}).then(manifest => {
    t.equal(manifest.version, '1.0.2', 'picked the right manifest using ~')
  })
})

test('basic mathematical range selection', t => {
  const metadata = {
    versions: {
      '1.0.0': { version: '1.0.0' },
      '1.0.1': { version: '1.0.1' },
      '1.0.2': { version: '1.0.2' },
      '2.0.0': { version: '2.0.0' }
    }
  }
  return pickManifest(metadata, spec('>=1.0.0 <2'), {}, manifest => {
    t.equal(manifest.version, '1.0.2', 'picked the right manifest using mathematical range')
  })
})

test('basic version selection', t => {
  const metadata = {
    versions: {
      '1.0.0': { version: '1.0.0' },
      '1.0.1': { version: '1.0.1' },
      '1.0.2': { version: '1.0.2' },
      '2.0.0': { version: '2.0.0' }
    }
  }
  return pickManifest(
    metadata, spec('1.0.0', 'version'), {}
  ).then(manifest => {
    t.equal(manifest.version, '1.0.0', 'picked the right manifest using specific version')
  })
})

test('basic tag selection', t => {
  const metadata = {
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
  return pickManifest(metadata, spec('foo', 'tag'), {}).then(manifest => {
    t.equal(manifest.version, '1.0.1', 'picked the right manifest using tag')
  })
})

test('errors if a non-registry spec is provided', t => {
  const metadata = {
    'dist-tags': {
      foo: '1.0.1'
    },
    versions: {
      '1.0.1': { version: '1.0.1' }
    }
  }
  return pickManifest(
    metadata, {spec: 'foo', type: 'uhhh'}, {}
  ).then(
    () => { throw new Error('expected error') },
    err => {
      t.ok(err, 'errored on bad spec type')
      t.match(err.message, /Only tag, version, and range are supported/)
    }
  )
})

test('skips any invalid version keys', t => {
  // Various third-party registries are prone to having trash as
  // keys. npm simply skips them. Yay robustness.
  const metadata = {
    versions: {
      '1.0.0': { version: '1.0.0' },
      'lol ok': { version: '1.0.1' }
    }
  }
  return BB.join(
    pickManifest(metadata, spec('^1.0.0'), {}).then(manifest => {
      t.equal(manifest.version, '1.0.0', 'avoided bad key')
    }),
    pickManifest(metadata, spec('^1.0.1'), {}).then(
      () => { throw new Error('expected a failure') },
      err => {
        t.ok(err, 'got an error')
        t.equal(err.code, 'ENOENT', 'no matching specs')
      }
    )
  )
})

test('ENOENT if range does not match anything', t => {
  const metadata = {
    versions: {
      '1.0.0': { version: '1.0.0' },
      '2.0.0': { version: '2.0.0' },
      '2.0.5': { version: '2.0.5' }
    }
  }
  return pickManifest(metadata, spec('^2.1.0'), {}).then(
    () => { throw new Error('expected a failure') },
    err => {
      t.ok(err, 'got an error')
      t.equal(err.code, 'ENOENT', 'useful error code returned.')
    }
  )
})

test('if `defaultTag` matches a given range, use it', t => {
  const metadata = {
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
  return BB.join(
    pickManifest(metadata, spec('^1.0.0'), {
      defaultTag: 'foo'
    }).then(manifest => {
      t.equal(manifest.version, '1.0.1', 'picked the version for foo')
    }),
    pickManifest(metadata, spec('^2.0.0'), {
      defaultTag: 'foo'
    }).then(manifest => {
      t.equal(manifest.version, '2.0.0', 'no match, no foo')
    }),
    pickManifest(metadata, spec('^1.0.0'), {}).then(manifest => {
      t.equal(manifest.version, '1.0.0', 'default to `latest`')
    })
  )
})

test('* ranges use `defaultTag` if no versions match', t => {
  const metadata = {
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
  return BB.join(
    pickManifest(metadata, spec('*'), {
      defaultTag: 'beta'
    }).then(manifest => {
      t.equal(manifest.version, '2.0.0-beta.0', 'used defaultTag for all-prerelease splat.')
    }),
    pickManifest(metadata, spec('*'), {}).then(manifest => {
      t.equal(manifest.version, '1.0.0-pre.0', 'defaulted to `latest`.')
    })
  )
})

test('errors if metadata has no versions', t => {
  return BB.join(
    pickManifest({versions: {}}, spec('^1.0.0'), {}).then(
      () => { throw new Error('expected an error') },
      err => {
        t.ok(err, 'got an error')
        t.equal(err.code, 'ENOVERSIONS', 'useful error code')
      }
    ),
    pickManifest({}, spec('^1.0.0'), {}).then(
      () => { throw new Error('expected an error') },
      err => {
        t.ok(err, 'got an error')
        t.equal(err.code, 'ENOVERSIONS', 'useful error code')
      }
    )
  )
})
