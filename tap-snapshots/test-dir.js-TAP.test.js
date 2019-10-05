/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/dir.js TAP basic > extract 1`] = `
Object {
  "integrity": "sha512-Ict4yhLfiPOkcX+yjBRSI2QUetKt+A08AXMyLeQbKGYg/OGI/1k47Hu9tWZOx1l4j+M1z07Zxt3IL41TmLkbDw==",
  "resolved": "\${CWD}/test/fixtures/abbrev",
}
`

exports[`test/dir.js TAP basic > manifest 1`] = `
Object {
  "_id": "abbrev@1.1.1",
  "_integrity": "null",
  "_resolved": "\${CWD}/test/fixtures/abbrev",
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

exports[`test/dir.js TAP basic > package.json extracted 1`] = `
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

exports[`test/dir.js TAP basic > packument 1`] = `
Object {
  "dist-tags": Object {
    "latest": "1.1.1",
  },
  "name": "abbrev",
  "versions": Object {
    "1.1.1": Object {
      "_id": "abbrev@1.1.1",
      "_integrity": "null",
      "_resolved": "\${CWD}/test/fixtures/abbrev",
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
        "integrity": "null",
        "tarball": "file:\${CWD}/test/fixtures/abbrev",
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

exports[`test/dir.js TAP with prepare script > extract 1`] = `
Object {
  "integrity": "sha512-xUCDNBpGrK4uuS6LLf6c367HTkNF9+ljWScpTI/d+/Qc5izFR/HxyxALO7fP4Vlr09qiPKZPxrjmav3s8Fs4UQ==",
  "resolved": "\${CWD}/test/fixtures/prepare-script",
}
`

exports[`test/dir.js TAP with prepare script > file list 1`] = `
Array [
  "index.js",
  "package.json",
  "prepare.js",
]
`

exports[`test/dir.js TAP with prepare script > manifest 1`] = `
Object {
  "_id": "git-prepare-script@1.0.0",
  "_integrity": "null",
  "_resolved": "\${CWD}/test/fixtures/prepare-script",
  "devDependencies": Object {
    "abbrev": "^1.1.1",
  },
  "license": "ISC",
  "main": "index.js",
  "name": "git-prepare-script",
  "readme": "ERROR: No README data found!",
  "scripts": Object {
    "prepare": "node prepare.js",
  },
  "version": "1.0.0",
}
`

exports[`test/dir.js TAP with prepare script > packument 1`] = `
Object {
  "dist-tags": Object {
    "latest": "1.0.0",
  },
  "name": "git-prepare-script",
  "versions": Object {
    "1.0.0": Object {
      "_id": "git-prepare-script@1.0.0",
      "_integrity": "null",
      "_resolved": "\${CWD}/test/fixtures/prepare-script",
      "devDependencies": Object {
        "abbrev": "^1.1.1",
      },
      "dist": Object {
        "integrity": "null",
        "tarball": "file:\${CWD}/test/fixtures/prepare-script",
      },
      "license": "ISC",
      "main": "index.js",
      "name": "git-prepare-script",
      "readme": "ERROR: No README data found!",
      "scripts": Object {
        "prepare": "node prepare.js",
      },
      "version": "1.0.0",
    },
  },
}
`
