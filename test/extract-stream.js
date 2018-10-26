'use strict'

const BB = require('bluebird')

const fs = BB.promisifyAll(require('fs'))
const mkdirp = BB.promisify(require('mkdirp'))
const mockTar = require('./util/mock-tarball')
const npmlog = require('npmlog')
const pipe = BB.promisify(require('mississippi').pipe)
const test = require('tap').test

require('./util/test-dir')(__filename)

const extractStream = require('../lib/extract-stream')

npmlog.level = process.env.LOGLEVEL || 'silent'
const OPTS = {
  log: npmlog
}

test('basic extraction', t => {
  const pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.0.0'
    }),
    'index.js': 'console.log("hello world!")'
  }
  t.plan(2)
  return mockTar(pkg, { stream: true }).then(tarStream => {
    return pipe(tarStream, extractStream('foo@1', './'))
  }).then(() => {
    return fs.readFileAsync('./package.json', 'utf8')
  }).then(data => {
    t.deepEqual(data, pkg['package.json'], 'extracted package.json')
    return fs.readFileAsync('./index.js', 'utf8')
  }).then(data => {
    t.equal(data, pkg['index.js'], 'extracted index.js')
  })
})

test('adds metadata fields if resolved/integrity are present', t => {
  const pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.0.0'
    }),
    'index.js': 'console.log("hello world!")'
  }
  return mockTar(pkg, { stream: true }).then(tarStream => {
    return pipe(tarStream, extractStream('foo@1', './', {
      resolved: 'https://stuff.is.here',
      integrity: 'sha1-deadbeef'
    }))
  }).then(() => {
    return fs.readFileAsync('./package.json', 'utf8')
  }).then(data => {
    t.deepEqual(JSON.parse(data), {
      name: 'foo',
      version: '1.0.0',
      _resolved: 'https://stuff.is.here',
      _integrity: 'sha1-deadbeef',
      _from: 'foo@1'
    }, 'extracted package.json')
  })
})

test('automatically handles gzipped tarballs', t => {
  const pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.0.0'
    }),
    'index.js': 'console.log("hello world!")'
  }
  return mockTar(pkg, { gzip: true, stream: true }).then(tarStream => {
    return pipe(tarStream, extractStream('foo@1', './', OPTS))
  }).then(() => {
    return BB.join(
      fs.readFileAsync('./package.json', 'utf8'),
      fs.readFileAsync('./index.js', 'utf8'),
      (json, indexjs) => {
        t.deepEqual(json, pkg['package.json'], 'got gunzipped package.json')
        t.equal(indexjs, pkg['index.js'], 'got gunzipped index.js')
      }
    )
  })
})

test('strips first item in path, even if not `package/`', t => {
  const pkg = {
    'package/package.json': JSON.stringify({
      name: 'foo',
      version: '1.0.0'
    }),
    'something-else/index.js': 'console.log("hello world!")'
  }
  return mockTar(pkg, { noPrefix: true, stream: true }).then(tarStream => {
    return pipe(tarStream, extractStream('foo@1', './', OPTS))
  }).then(() => {
    return BB.join(
      fs.readFileAsync('./package.json', 'utf8'),
      fs.readFileAsync('./index.js', 'utf8'),
      (json, indexjs) => {
        t.deepEqual(
          json, pkg['package/package.json'], 'flattened package.json')
        t.equal(
          indexjs, pkg['something-else/index.js'], 'flattened index.js')
      }
    )
  })
})

test('excludes symlinks', t => {
  const pkg = {
    'package.json': JSON.stringify({
      name: 'foo',
      version: '1.0.0'
    }),
    'index.js': 'console.log("hello world!")',
    'linky': { type: 'Link', linkname: '/usr/local/bin/linky' },
    'symmylinky': { type: 'SymbolicLink', linkname: '../nowhere' }
  }
  return mockTar(pkg, { stream: true }).then(tarStream => {
    return pipe(tarStream, extractStream('foo@1', './', OPTS))
  }).then(() => {
    return BB.join(
      fs.readFileAsync('./package.json', 'utf8').then(data => {
        t.deepEqual(data, pkg['package.json'], 'package.json still there')
      }),
      fs.statAsync('./linky').then(
        stat => { throw new Error('this was supposed to error' + JSON.stringify(stat)) },
        err => {
          t.equal(err.code, 'ENOENT', 'hard link excluded!')
        }
      ),
      fs.readFileAsync('./symmylinky').then(
        () => { throw new Error('this was supposed to error') },
        err => {
          t.equal(err.code, 'ENOENT', 'symlink excluded!')
        }
      )
    )
  })
})

// Yes, this logic is terrible and seriously confusing, but
// I'm pretty sure this is exactly what npm is doing.
// ...we should really deprecate this cluster.
test('renames .gitignore to .npmignore if not present', t => {
  return mkdirp('./no-npmignore').then(() => {
    return mockTar({
      'package.json': JSON.stringify({
        name: 'foo',
        version: '1.0.0'
      }),
      'index.js': 'console.log("hello world!")',
      '.gitignore': 'tada!'
    }, { stream: true }).then(tarStream => {
      return pipe(tarStream, extractStream('foo@1', './no-npmignore', OPTS))
    }).then(() => {
      return fs.readFileAsync(
        './no-npmignore/.npmignore', 'utf8'
      ).then(data => {
        t.deepEqual(data, 'tada!', '.gitignore renamed to .npmignore')
      })
    })
  }).then(() => {
    return mkdirp('./has-npmignore1')
  }).then(() => {
    return mockTar({
      'package.json': JSON.stringify({
        name: 'foo',
        version: '1.0.0'
      }),
      'index.js': 'console.log("hello world!")',
      '.gitignore': 'git!',
      '.npmignore': 'npm!'
    }, { stream: true }).then(tarStream => {
      return pipe(tarStream, extractStream('foo@1', './has-npmignore1', OPTS))
    }).then(() => {
      return BB.join(
        fs.readFileAsync(
          './has-npmignore1/.npmignore', 'utf8'
        ).then(data => {
          t.deepEqual(data, 'npm!', '.npmignore left intact if present')
        }),
        fs.readFileAsync(
          './has-npmignore1/.gitignore', 'utf8'
        ).then(
          () => { throw new Error('expected an error') },
          err => {
            t.ok(err, 'got expected error on reading .gitignore')
            t.equal(err.code, 'ENOENT', '.gitignore missing')
          }
        )
      )
    })
  }).then(() => {
    return mkdirp('./has-npmignore2')
  }).then(() => {
    return mockTar({
      'package.json': JSON.stringify({
        name: 'foo',
        version: '1.0.0'
      }),
      'index.js': 'console.log("hello world!")',
      '.npmignore': 'npm!',
      '.gitignore': 'git!'
    }, { stream: true }).then(tarStream => {
      return pipe(tarStream, extractStream('foo@1', './has-npmignore2', OPTS))
    }).then(() => {
      return BB.join(
        fs.readFileAsync(
          './has-npmignore2/.npmignore', 'utf8'
        ).then(data => {
          t.deepEqual(data, 'npm!', '.npmignore left intact if present')
        }),
        fs.readFileAsync(
          './has-npmignore2/.gitignore', 'utf8'
        ).then(data => {
          t.deepEqual(data, 'git!', '.gitignore intact if we previously had an .npmignore')
        })
      )
    })
  })
})

test('accepts dmode/fmode/umask opts', {
  skip: process.platform === 'win32'
}, t => {
  const pkg = {
    'package.json': {
      data: JSON.stringify({
        name: 'foo',
        version: '1.0.0'
      }),
      // has a mode
      mode: 0o644
    },
    // will use fmode
    'foo/index.js': 'console.log("hello world!")',
    'bin/cli.js': {
      data: 'console.log("hello world!")',
      // executable
      mode: 0o755
    }
  }
  return mockTar(pkg, { stream: true }).then(tarStream => {
    return pipe(tarStream, extractStream('foo@1', './', {
      dmode: 0o644,
      fmode: 0o666,
      umask: 0o022
    }))
  }).then(() => {
    return BB.join(
      fs.statAsync('./package.json').then(stat => {
        t.equal(
          // 0644 & ~umask(266) => 400
          stat.mode & 0o777,
          0o644,
          'fmode set as expected'
        )
      }),
      // no entry in tarball, so mode is default from node-tar (0700) mixed with
      // our provided dmode (555) and umask (0266) on the extractor
      fs.statAsync('./foo').then(stat => {
        t.equal(
          stat.mode & 0o777,
          0o755,
          'mode set as expected'
        )
      }),
      fs.statAsync('./foo/index.js').then(stat => {
        t.equal(
          stat.mode & 0o777,
          0o644,
          'fmode set as expected'
        )
      }),
      fs.statAsync('./bin/cli.js').then(stat => {
        t.equal(
          stat.mode & 0o777,
          0o755,
          'preserved execute bit as expected'
        )
      })
    )
  })
})
