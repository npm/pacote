/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/file.js TAP basic > extract 1`] = `
Object {
  "integrity": "sha512-nne9/IiQ/hzIhY6pdDnbBtz7DjPTKrY00P/zvPSm5pOFkl6xuGrGnXn/VtTNNfNtAfZ9/1RtehkszU9qcTii0Q==",
  "resolved": "/Users/isaacs/dev/npm/pacote/test/fixtures/abbrev-1.1.1.tgz",
}
`

exports[`test/file.js TAP basic > manifest 1`] = `
Object {
  "_id": "abbrev@1.1.1",
  "_integrity": "sha512-nne9/IiQ/hzIhY6pdDnbBtz7DjPTKrY00P/zvPSm5pOFkl6xuGrGnXn/VtTNNfNtAfZ9/1RtehkszU9qcTii0Q==",
  "_resolved": "/Users/isaacs/dev/npm/pacote/test/fixtures/abbrev-1.1.1.tgz",
  "author": Object {
    "email": "i@izs.me",
    "name": "Isaac Z. Schlueter",
  },
  "bugs": Object {
    "url": "https://github.com/isaacs/abbrev-js/issues",
  },
  "description": "Like ruby's abbrev module, but in js",
  "devDependencies": Object {
    "tap": "^10.1",
  },
  "files": Array [
    "abbrev.js",
  ],
  "homepage": "https://github.com/isaacs/abbrev-js#readme",
  "license": "ISC",
  "main": "abbrev.js",
  "name": "abbrev",
  "readme": "# abbrev-js\\n\\nJust like [ruby's Abbrev](http://apidock.com/ruby/Abbrev).\\n\\nUsage:\\n\\n    var abbrev = require(\\"abbrev\\");\\n    abbrev(\\"foo\\", \\"fool\\", \\"folding\\", \\"flop\\");\\n    \\n    // returns:\\n    { fl: 'flop'\\n    , flo: 'flop'\\n    , flop: 'flop'\\n    , fol: 'folding'\\n    , fold: 'folding'\\n    , foldi: 'folding'\\n    , foldin: 'folding'\\n    , folding: 'folding'\\n    , foo: 'foo'\\n    , fool: 'fool'\\n    }\\n\\nThis is handy for command-line scripts, or other cases where you want to be able to accept shorthands.\\n",
  "readmeFilename": "README.md",
  "repository": Object {
    "type": "git",
    "url": "git+ssh://git@github.com/isaacs/abbrev-js.git",
  },
  "scripts": Object {
    "postpublish": "git push origin --all; git push origin --tags",
    "postversion": "npm publish",
    "preversion": "npm test",
    "test": "tap test.js --100",
  },
  "version": "1.1.1",
}
`

exports[`test/file.js TAP basic > package.json extracted 1`] = `
Object {
  "author": "Isaac Z. Schlueter <i@izs.me>",
  "description": "Like ruby's abbrev module, but in js",
  "devDependencies": Object {
    "tap": "^10.1",
  },
  "files": Array [
    "abbrev.js",
  ],
  "license": "ISC",
  "main": "abbrev.js",
  "name": "abbrev",
  "repository": "http://github.com/isaacs/abbrev-js",
  "scripts": Object {
    "postpublish": "git push origin --all; git push origin --tags",
    "postversion": "npm publish",
    "preversion": "npm test",
    "test": "tap test.js --100",
  },
  "version": "1.1.1",
}
`

exports[`test/file.js TAP basic > packument 1`] = `
Object {
  "dist-tags": Object {
    "latest": "1.1.1",
  },
  "name": "abbrev",
  "versions": Object {
    "1.1.1": Object {
      "_id": "abbrev@1.1.1",
      "_integrity": "sha512-nne9/IiQ/hzIhY6pdDnbBtz7DjPTKrY00P/zvPSm5pOFkl6xuGrGnXn/VtTNNfNtAfZ9/1RtehkszU9qcTii0Q==",
      "_resolved": "/Users/isaacs/dev/npm/pacote/test/fixtures/abbrev-1.1.1.tgz",
      "author": Object {
        "email": "i@izs.me",
        "name": "Isaac Z. Schlueter",
      },
      "bugs": Object {
        "url": "https://github.com/isaacs/abbrev-js/issues",
      },
      "description": "Like ruby's abbrev module, but in js",
      "devDependencies": Object {
        "tap": "^10.1",
      },
      "dist": Object {
        "integrity": "sha512-nne9/IiQ/hzIhY6pdDnbBtz7DjPTKrY00P/zvPSm5pOFkl6xuGrGnXn/VtTNNfNtAfZ9/1RtehkszU9qcTii0Q==",
        "tarball": "file:/Users/isaacs/dev/npm/pacote/test/fixtures/abbrev-1.1.1.tgz",
      },
      "files": Array [
        "abbrev.js",
      ],
      "homepage": "https://github.com/isaacs/abbrev-js#readme",
      "license": "ISC",
      "main": "abbrev.js",
      "name": "abbrev",
      "readme": "# abbrev-js\\n\\nJust like [ruby's Abbrev](http://apidock.com/ruby/Abbrev).\\n\\nUsage:\\n\\n    var abbrev = require(\\"abbrev\\");\\n    abbrev(\\"foo\\", \\"fool\\", \\"folding\\", \\"flop\\");\\n    \\n    // returns:\\n    { fl: 'flop'\\n    , flo: 'flop'\\n    , flop: 'flop'\\n    , fol: 'folding'\\n    , fold: 'folding'\\n    , foldi: 'folding'\\n    , foldin: 'folding'\\n    , folding: 'folding'\\n    , foo: 'foo'\\n    , fool: 'fool'\\n    }\\n\\nThis is handy for command-line scripts, or other cases where you want to be able to accept shorthands.\\n",
      "readmeFilename": "README.md",
      "repository": Object {
        "type": "git",
        "url": "git+ssh://git@github.com/isaacs/abbrev-js.git",
      },
      "scripts": Object {
        "postpublish": "git push origin --all; git push origin --tags",
        "postversion": "npm publish",
        "preversion": "npm test",
        "test": "tap test.js --100",
      },
      "version": "1.1.1",
    },
  },
}
`
