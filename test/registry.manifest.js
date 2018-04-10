'use strict'

const BB = require('bluebird')

const npa = require('npm-package-arg')
const npmlog = require('npmlog')
const test = require('tap').test
const tnock = require('./util/tnock')

const Manifest = require('../lib/finalize-manifest').Manifest
const manifest = require('../manifest')

const BASE = {
  name: 'foo',
  version: '1.2.3',
  _hasShrinkwrap: false,
  _integrity: 'sha1-deadbeef',
  _shasum: '75e69d6de79f',
  _resolved: 'https://foo.bar/x.tgz',
  dist: {
    integrity: 'sha1-deadbeef',
    shasum: '75e69d6de79f',
    tarball: 'https://foo.bar/x.tgz'
  }
}

const META = {
  name: 'foo',
  'dist-tags': { latest: '1.2.3', lts: '1.2.1' },
  versions: {
    '0.0.0': {
      name: 'foo',
      version: '0.0.0'
    },
    '1.2.0': {
      name: 'foo',
      version: '1.2.0',
      engines: {
        node: '^1.0.0',
        npm: '^2.0.1'
      }
    },
    '2.0.4': {
      name: 'foo',
      version: '2.0.4',
      _hasShrinkwrap: false,
      _integrity: 'sha1-deadbeef',
      _shasum: '75e69d6de79f',
      _resolved: 'https://foo.bar/x.tgz',
      dist: {
        integrity: 'sha1-deadbeef',
        shasum: '75e69d6de79f',
        tarball: 'https://foo.bar/x.tgz'
      }
    },
    '2.0.5': {
      name: 'foo',
      version: '2.0.5',
      deprecated: 'yes. yes it is.',
      _hasShrinkwrap: false,
      _integrity: 'sha1-deadbeef',
      _shasum: '75e69d6de79f',
      _resolved: 'https://foo.bar/x.tgz',
      dist: {
        integrity: 'sha1-deadbeef',
        shasum: '75e69d6de79f',
        tarball: 'https://foo.bar/x.tgz'
      }
    },
    '1.2.1': {
      name: 'foo',
      version: '1.2.1'
    },
    '1.2.3': BASE,
    '1.2.4': {
      name: 'foo',
      version: '1.2.4'
    },
    '3.4.5': {
      name: 'foo',
      version: '3.4.5'
    }
  }
}
const PKG = new Manifest(BASE)

npmlog.level = process.env.LOGLEVEL || 'silent'
const OPTS = {
  registry: 'https://mock.reg',
  log: npmlog,
  retry: {
    retries: 1,
    factor: 1,
    minTimeout: 1,
    maxTimeout: 10
  }
}

test('fetches version from registry', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/foo').reply(200, META)
  return manifest('foo@1.2.3', OPTS).then(pkg => {
    t.deepEqual(pkg, PKG, 'got manifest from version')
  })
})

test('fetchest tag from registry', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/foo').reply(200, META)
  return manifest('foo@latest', OPTS).then(pkg => {
    t.deepEqual(pkg, PKG, 'got manifest from tag')
  })
})

test('fetches version from scoped registry', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/@usr%2ffoo').reply(200, META)
  return manifest('@usr/foo@1.2.3', OPTS).then(pkg => {
    t.deepEqual(pkg, PKG, 'got scoped manifest from version')
  })
})

test('fetches tag from scoped registry', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/@usr%2ffoo').reply(200, META)
  return manifest('@usr/foo@latest', OPTS).then(pkg => {
    t.deepEqual(pkg, PKG, 'got scoped manifest from tag')
  })
})

test('fetches manifest from registry by range', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/foo').reply(200, META)
  return manifest('foo@^1.2.0', OPTS).then(pkg => {
    // Not 1.2.4 because 1.2.3 is `latest`
    t.deepEqual(pkg, new Manifest(META.versions['1.2.3']), 'picked right manifest')
  })
})

test('fetches manifest from registry by alias', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/foo').reply(200, META)
  return manifest('bar@npm:foo@^1.2.0', OPTS).then(pkg => {
    // Not 1.2.4 because 1.2.3 is `latest`
    t.deepEqual(pkg, new Manifest(META.versions['1.2.3']), 'picked right manifest')
  })
})

test('fetches manifest from scoped registry by range', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/@usr%2ffoo').reply(200, META)
  return manifest('@usr/foo@^1.2.0', OPTS).then(pkg => {
    t.deepEqual(pkg, new Manifest(META.versions['1.2.3']), 'got scoped manifest from version')
  })
})

test('fetches scoped manifest from registry by alias', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/@usr%2ffoo').reply(200, META)
  return manifest('bar@npm:@usr/foo@^1.2.0', OPTS).then(pkg => {
    t.deepEqual(pkg, new Manifest(META.versions['1.2.3']), 'got scoped manifest from version')
  })
})

test('supports opts.includeDeprecated', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/foo').reply(200, META)
  return manifest('foo@^2', Object.assign({
    includeDeprecated: true
  }, OPTS)).then(pkg => {
    t.deepEqual(pkg, new Manifest(META.versions['2.0.5']), 'got deprecated')
    return manifest('foo@^2.0', Object.assign({
      includeDeprecated: false
    }, OPTS))
  }).then(pkg => {
    t.deepEqual(pkg, new Manifest(META.versions['2.0.4']), 'non-deprecated')
  })
})

test('sends auth token if passed in opts', t => {
  const TOKEN = 'deadbeef'
  const opts = {
    log: OPTS.log,
    registry: OPTS.registry,
    '//mock.reg/:_authToken': TOKEN
  }

  const srv = tnock(t, OPTS.registry)
  srv.get(
    '/foo'
  ).matchHeader(
    'authorization', 'Bearer ' + TOKEN
  ).reply(200, META)
  return manifest('foo@1.2.3', opts).then(pkg => {
    t.deepEqual(pkg, PKG, 'got manifest from version')
  })
})

test('treats options as optional', t => {
  const srv = tnock(t, 'https://registry.npmjs.org')

  srv.get('/foo').reply(200, META)
  return manifest('foo@1.2.3').then(pkg => {
    t.deepEqual(pkg, PKG, 'used default options')
  })
})

test('uses scope from spec for registry lookup', t => {
  const opts = {
    '@myscope:registry': OPTS.registry,
    // package scope takes priority
    scope: '@otherscope'
  }
  const srv = tnock(t, OPTS.registry)
  srv.get('/@myscope%2ffoo').reply(200, META)
  return manifest('@myscope/foo@1.2.3', opts).then(pkg => {
    t.deepEqual(pkg, PKG, 'used scope to pick registry')
  })
})

test('uses scope opt for registry lookup', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/foo').reply(200, META)
  srv.get('/bar').reply(200, META)

  return BB.join(
    manifest('foo@1.2.3', {
      '@myscope:registry': OPTS.registry,
      scope: '@myscope',
      // scope option takes priority
      registry: 'nope'
    }).then(pkg => {
      t.deepEqual(pkg, PKG, 'used scope to pick registry')
    }),
    manifest('bar@latest', {
      '@myscope:registry': OPTS.registry,
      scope: 'myscope' // @ auto-inserted
    }).then(pkg => {
      t.deepEqual(pkg, PKG, 'scope @ was auto-inserted')
    })
  )
})

test('defaults to registry.npmjs.org if no option given', t => {
  const srv = tnock(t, 'https://registry.npmjs.org')

  srv.get('/foo').reply(200, META)
  return manifest('foo@1.2.3', { registry: undefined }).then(pkg => {
    t.deepEqual(pkg, PKG, 'used npm registry')
  })
})

test('supports scoped auth', t => {
  const TOKEN = 'deadbeef'
  const opts = {
    scope: 'myscope',
    '@myscope:registry': OPTS.registry,
    '//mock.reg/:_authToken': TOKEN
  }
  const srv = tnock(t, OPTS.registry)
  srv.get(
    '/foo'
  ).matchHeader(
    'authorization', 'Bearer ' + TOKEN
  ).reply(200, META)
  return manifest('foo@1.2.3', opts).then(pkg => {
    t.deepEqual(pkg, PKG, 'used scope to pick registry and auth')
  })
})

test('sends auth token if passed in global opts', t => {
  const TOKEN = 'deadbeef'
  const opts = {
    registry: OPTS.registry,
    'always-auth': true,
    token: TOKEN
  }

  const srv = tnock(t, OPTS.registry)
  srv.get(
    '/foo'
  ).matchHeader(
    'authorization', 'Bearer ' + TOKEN
  ).reply(200, META)
  return manifest('foo@1.2.3', opts).then(pkg => {
    t.deepEqual(pkg, PKG, 'got manifest from version')
  })
})

test('sends basic authorization if alwaysAuth and _auth', t => {
  const TOKEN = 'deadbeef'
  const opts = {
    registry: OPTS.registry,
    alwaysAuth: true,
    _auth: TOKEN
  }

  const srv = tnock(t, OPTS.registry)
  srv.get(
    '/foo'
  ).matchHeader(
    'authorization', 'Basic ' + TOKEN
  ).reply(200, META)
  return manifest('foo@1.2.3', opts).then(pkg => {
    t.deepEqual(pkg, PKG, 'got manifest from version')
  })
})

test('package requests are case-sensitive', t => {
  const srv = tnock(t, OPTS.registry)

  const CASEDBASE = {
    name: 'Foo',
    version: '1.2.3',
    _hasShrinkwrap: false,
    _integrity: 'sha1-foobarbaz',
    _shasum: '75e69d6de79f',
    _resolved: 'https://foo.bar/x.tgz',
    dist: {
      integrity: 'sha1-foobarbaz',
      shasum: '75e69d6de79f',
      tarball: 'https://foo.bar/x.tgz'
    }
  }
  const CASEDPKG = new Manifest(CASEDBASE)
  srv.get('/Foo').reply(200, {
    versions: {
      '1.2.3': CASEDBASE
    }
  })
  srv.get('/foo').reply(200, META)

  return BB.join(
    manifest('Foo@1.2.3', OPTS).then(pkg => {
      t.deepEqual(pkg, CASEDPKG, 'got Cased package')
    }),
    manifest('foo@1.2.3', OPTS).then(pkg => {
      t.deepEqual(pkg, PKG, 'got lowercased package')
    })
  )
})

test('handles server-side case-normalization', t => {
  const srv = tnock(t, OPTS.registry)

  srv.get('/Cased').reply(200, META)
  srv.get('/cased').reply(200, META)

  return BB.join(
    manifest('Cased@1.2.3', OPTS).then(pkg => {
      t.deepEqual(pkg, PKG, 'got Cased package')
    }),
    manifest('cased@latest', OPTS).then(pkg => {
      t.deepEqual(pkg, PKG, 'got lowercased package')
    })
  )
})

test('recovers from request errors', t => {
  t.plan(4)
  const srv = tnock(t, OPTS.registry)
  const opts = {
    log: OPTS.log,
    registry: OPTS.registry,
    retry: {
      retries: 2,
      minTimeout: 1,
      maxTimeout: 10
    }
  }

  srv.get('/foo').reply(500, function (uri, body) {
    srv.get('/foo').reply(500, function (uri, body) {
      srv.get('/foo').reply(200, function (uri, body) {
        t.ok(true, 'final success')
        return META
      })
      t.ok(true, 'second errored request')
      return body
    })
    t.ok(true, 'first errored request')
    return body
  })

  manifest('foo@1.2.3', opts).then(pkg => {
    t.deepEqual(pkg, PKG, 'got a manifest')
  })
})

test('optionally annotates manifest with request-related metadata', t => {
  const srv = tnock(t, OPTS.registry)
  const opts = {
    log: OPTS.log,
    registry: OPTS.registry,
    retry: false,
    annotate: true,
    where: 'right here'
  }
  const annotated = new Manifest(BASE)
  annotated._from = 'foo@1.2.3'
  annotated._requested = npa('foo@1.2.3')
  annotated._spec = 'foo@1.2.3'
  annotated._where = opts.where

  srv.get('/foo').reply(200, META)
  return manifest('foo@1.2.3', opts).then(pkg => {
    t.deepEqual(pkg, annotated, 'additional data was added to pkg')
  })
})

test('sends npm-session header if passed in opts', t => {
  const SESSION_ID = 'deadbeef'
  const opts = {
    log: OPTS.log,
    registry: OPTS.registry,
    npmSession: SESSION_ID
  }

  const srv = tnock(t, OPTS.registry)
  srv.get(
    '/foo'
  ).matchHeader(
    'npm-session', SESSION_ID
  ).reply(200, META)
  return manifest('foo@1.2.3', opts).then(pkg => {
    t.deepEqual(pkg, PKG, 'npm-session header was sent')
  })
})
