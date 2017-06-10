'use strict'

const BB = require('bluebird')

const fs = BB.promisifyAll(require('fs'))
const mockTar = require('./util/mock-tarball')
const npmlog = require('npmlog')
const path = require('path')
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
  return mockTar(pkg, {stream: true}).then(tarStream => {
    return pipe(tarStream, extractStream('./'))
  }).then(() => {
    return fs.readFileAsync('./package.json', 'utf8')
  }).then(data => {
    t.deepEqual(data, pkg['package.json'], 'extracted package.json')
    return fs.readFileAsync('./index.js', 'utf8')
  }).then(data => {
    t.equal(data, pkg['index.js'], 'extracted index.js')
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
  return mockTar(pkg, {gzip: true, stream: true}).then(tarStream => {
    return pipe(tarStream, extractStream('./', OPTS))
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
  return mockTar(pkg, {noPrefix: true, stream: true}).then(tarStream => {
    return pipe(tarStream, extractStream('./', OPTS))
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
    'linky': { type: 'link', linkname: '/usr/local/bin/linky' },
    'symmylinky': { type: 'symlink', linkname: '../nowhere' }
  }
  return mockTar(pkg, {stream: true}).then(tarStream => {
    return pipe(tarStream, extractStream('./', OPTS))
  }).then(() => {
    return BB.join(
      fs.readFileAsync('./package.json', 'utf8').then(data => {
        t.deepEqual(data, pkg['package.json'], 'package.json still there')
      }),
      fs.statAsync('./linky').then(
        () => { throw new Error('this was supposed to error') },
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
  return BB.join(
    mockTar({
      'package.json': JSON.stringify({
        name: 'foo',
        version: '1.0.0'
      }),
      'index.js': 'console.log("hello world!")',
      '.gitignore': 'tada!'
    }, {stream: true}).then(tarStream => {
      return pipe(tarStream, extractStream('./no-npmignore', OPTS))
    }).then(() => {
      return fs.readFileAsync(
        './no-npmignore/.npmignore', 'utf8'
      ).then(data => {
        t.deepEqual(data, 'tada!', '.gitignore renamed to .npmignore')
      })
    }),
    mockTar({
      'package.json': JSON.stringify({
        name: 'foo',
        version: '1.0.0'
      }),
      'index.js': 'console.log("hello world!")',
      '.gitignore': 'git!',
      '.npmignore': 'npm!'
    }, {stream: true}).then(tarStream => {
      return pipe(tarStream, extractStream('./has-npmignore1', OPTS))
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
    }),
    mockTar({
      'package.json': JSON.stringify({
        name: 'foo',
        version: '1.0.0'
      }),
      'index.js': 'console.log("hello world!")',
      '.npmignore': 'npm!',
      '.gitignore': 'git!'
    }, {stream: true}).then(tarStream => {
      return pipe(tarStream, extractStream('./has-npmignore2', OPTS))
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
  )
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
      fmode: parseInt('777', 8),
      dmode: parseInt('777', 8),
      umask: parseInt('777', 8)
    },
    'foo/index.js': 'console.log("hello world!")'
  }
  return mockTar(pkg, {stream: true}).then(tarStream => {
    return pipe(tarStream, extractStream('./', {
      dmode: parseInt('555', 8),
      fmode: parseInt('644', 8),
      umask: parseInt('266', 8)
    }))
  }).then(() => {
    return BB.join(
      fs.statAsync('./package.json').then(stat => {
        t.equal(
          stat.mode & parseInt('000777', 8),
          parseInt('400', 8),
          'fmode set as expected'
        )
      }),
      // TODO - I don't understand why this one is always 755
      // fs.stat('./foo', function (err, stat) {
      //   t.equal(
      //     stat.mode & parseInt('000777', 8),
      //     parseInt('411', 8),
      //     'dmode set as expected'
      //   )
      // })
      fs.statAsync('./foo/index.js').then(stat => {
        t.equal(
          stat.mode & parseInt('000777', 8),
          parseInt('400', 8),
          'fmode set as expected'
        )
      })
    )
  })
})

test('extracts filenames with special characters', {
  skip: process.platform !== 'win32'
}, t => {
  const tarStream = fs.createReadStream('../../fixtures/special-characters.tgz');
  const workingDir = './special-characters/'
  return pipe(tarStream, extractStream(workingDir))
    .then(() => {
      const fileNamesUnderTest = [
        'filename:with:colons',
        'filename<with<less<than<signs',
        'filename>with>more>than>signs',
        'filename|with|pipes',
        'filename?with?question?marks'
      ].map(fileName => {
        return {
          rawFileName: fileName,
          expectedFileName: fileName.replace(/[:?<>|]/g, '_'),
          expectedContent: fileName
        }
      })

      return BB.all(fileNamesUnderTest.map(fileNameUnderTest => {
        return fs.readFileAsync(path.join(workingDir, fileNameUnderTest.expectedFileName), 'utf8')
          .then(data => {
            t.equal(data.trim(), fileNameUnderTest.expectedContent, 'Filename "' + fileNameUnderTest.rawFileName + '" was sanitized and content left intact')
          })
          .catch(err => {
            return BB.reject(new Error('Filename "' + fileNameUnderTest.rawFileName + '" was not extracted: ' + err))
          })
      }))
    })
    .catch(err => {
      if (err.code === 'ENOENT') {
        return BB.reject(new Error('Unable to extract the tarball with special characters in filenames.'))
      }
      return BB.reject(err)
    })
});
