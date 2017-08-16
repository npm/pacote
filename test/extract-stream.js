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
    'linky': { type: 'Link', linkname: '/usr/local/bin/linky' },
    'symmylinky': { type: 'SymbolicLink', linkname: '../nowhere' }
  }
  return mockTar(pkg, {stream: true}).then(tarStream => {
    return pipe(tarStream, extractStream('./', OPTS))
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
      fmode: parseInt('444', 8),
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
  skip: process.platform !== 'win32' &&
  'special character conversion is only needed on Windows'
}, t => {
  const tarStream = fs.createReadStream('../../fixtures/special-characters.tgz')
  return pipe(tarStream, extractStream('.')).then(() => {
    const fileNamesUnderTest = [
      'filename:with:colons',
      'filename<with<less<than<signs',
      'filename>with>more>than>signs',
      'filename|with|pipes',
      'filename?with?question?marks'
    ].map(fileName => ({
      rawFileName: fileName,
      expectedFileName: ':<>|?'.split('').reduce((s, c) => {
        return s.split(c).join(String.fromCharCode(0xf000 + c.charCodeAt(0)))
      }, fileName),
      expectedContent: fileName
    }))

    return BB.all(fileNamesUnderTest.map(fileNameUnderTest => {
      const filePath = fileNameUnderTest.expectedFileName
      return fs.readFileAsync(filePath, 'utf8').then(data => {
        t.equal(
          data.trim(),
          fileNameUnderTest.expectedContent,
          `Filename "${
            fileNameUnderTest.rawFileName
          }" was sanitized and content left intact`
        )
      })
    }))
  })
})
