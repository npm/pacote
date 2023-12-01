/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/dir.js TAP basic > extract 1`] = `
Object {
  "from": "file:test/fixtures/abbrev",
  "integrity": "{integrity}",
  "resolved": "\${CWD}/test/fixtures/abbrev",
}
`

exports[`test/dir.js TAP basic > manifest 1`] = `
Object {
  "_from": "file:test/fixtures/abbrev",
  "_id": "abbrev@1.1.1",
  "_integrity": null,
  "_resolved": "\${CWD}/test/fixtures/abbrev",
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
      "_from": "file:test/fixtures/abbrev",
      "_id": "abbrev@1.1.1",
      "_integrity": null,
      "_resolved": "\${CWD}/test/fixtures/abbrev",
      "author": "Isaac Z. Schlueter <i@izs.me>",
      "description": "Like ruby's abbrev module, but in js",
      "devDependencies": Object {
        "tap": "^10.1",
      },
      "dist": Object {
        "integrity": null,
        "tarball": "file:\${CWD}/test/fixtures/abbrev",
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
    },
  },
}
`

exports[`test/dir.js TAP basic > saved package.json 1`] = `
Object {
  "_from": "file:test/fixtures/abbrev",
  "_id": "abbrev@1.1.1",
  "_integrity": null,
  "_resolved": "\${CWD}/test/fixtures/abbrev",
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

exports[`test/dir.js TAP dir with integrity > packument 1`] = `
Object {
  "dist-tags": Object {
    "latest": "1.1.1",
  },
  "name": "abbrev",
  "versions": Object {
    "1.1.1": Object {
      "_from": "file:test/fixtures/abbrev",
      "_id": "abbrev@1.1.1",
      "_integrity": "sha512-whatever-this-is-only-checked-if-we-extract-it",
      "_resolved": "\${CWD}/test/fixtures/abbrev",
      "author": "Isaac Z. Schlueter <i@izs.me>",
      "description": "Like ruby's abbrev module, but in js",
      "devDependencies": Object {
        "tap": "^10.1",
      },
      "dist": Object {
        "integrity": "{integrity}",
        "tarball": "file:\${CWD}/test/fixtures/abbrev",
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
    },
  },
}
`

exports[`test/dir.js TAP make bins executable > results of unpack 1`] = `
Object {
  "from": "file:test/fixtures/bin-object",
  "integrity": "{integrity}",
  "resolved": "\${CWD}/test/fixtures/bin-object",
}
`

exports[`test/dir.js TAP responds to foregroundScripts: true > extract 1`] = `
Object {
  "from": "file:test/fixtures/prepare-script",
  "integrity": "{integrity}",
  "resolved": "\${CWD}/test/fixtures/prepare-script",
}
`

exports[`test/dir.js TAP responds to foregroundScripts: true > file list 1`] = `
Array [
  "index.js",
  "package.json",
  "prepare.js",
]
`

exports[`test/dir.js TAP responds to foregroundScripts: true > manifest 1`] = `
Object {
  "_from": "file:test/fixtures/prepare-script",
  "_id": "git-prepare-script@1.0.0",
  "_integrity": null,
  "_resolved": "\${CWD}/test/fixtures/prepare-script",
  "devDependencies": Object {
    "abbrev": "^1.1.1",
  },
  "license": "ISC",
  "main": "index.js",
  "name": "git-prepare-script",
  "scripts": Object {
    "prepare": "node prepare.js",
  },
  "version": "1.0.0",
}
`

exports[`test/dir.js TAP responds to foregroundScripts: true > packument 1`] = `
Object {
  "dist-tags": Object {
    "latest": "1.0.0",
  },
  "name": "git-prepare-script",
  "versions": Object {
    "1.0.0": Object {
      "_from": "file:test/fixtures/prepare-script",
      "_id": "git-prepare-script@1.0.0",
      "_integrity": null,
      "_resolved": "\${CWD}/test/fixtures/prepare-script",
      "devDependencies": Object {
        "abbrev": "^1.1.1",
      },
      "dist": Object {
        "integrity": null,
        "tarball": "file:\${CWD}/test/fixtures/prepare-script",
      },
      "license": "ISC",
      "main": "index.js",
      "name": "git-prepare-script",
      "scripts": Object {
        "prepare": "node prepare.js",
      },
      "version": "1.0.0",
    },
  },
}
`

exports[`test/dir.js TAP responds to foregroundScripts: true and silent: true > extract 1`] = `
Object {
  "from": "file:test/fixtures/prepare-script",
  "integrity": "{integrity}",
  "resolved": "\${CWD}/test/fixtures/prepare-script",
}
`

exports[`test/dir.js TAP responds to foregroundScripts: true and silent: true > file list 1`] = `
Array [
  "index.js",
  "package.json",
  "prepare.js",
]
`

exports[`test/dir.js TAP responds to foregroundScripts: true and silent: true > manifest 1`] = `
Object {
  "_from": "file:test/fixtures/prepare-script",
  "_id": "git-prepare-script@1.0.0",
  "_integrity": null,
  "_resolved": "\${CWD}/test/fixtures/prepare-script",
  "devDependencies": Object {
    "abbrev": "^1.1.1",
  },
  "license": "ISC",
  "main": "index.js",
  "name": "git-prepare-script",
  "scripts": Object {
    "prepare": "node prepare.js",
  },
  "version": "1.0.0",
}
`

exports[`test/dir.js TAP responds to foregroundScripts: true and silent: true > packument 1`] = `
Object {
  "dist-tags": Object {
    "latest": "1.0.0",
  },
  "name": "git-prepare-script",
  "versions": Object {
    "1.0.0": Object {
      "_from": "file:test/fixtures/prepare-script",
      "_id": "git-prepare-script@1.0.0",
      "_integrity": null,
      "_resolved": "\${CWD}/test/fixtures/prepare-script",
      "devDependencies": Object {
        "abbrev": "^1.1.1",
      },
      "dist": Object {
        "integrity": null,
        "tarball": "file:\${CWD}/test/fixtures/prepare-script",
      },
      "license": "ISC",
      "main": "index.js",
      "name": "git-prepare-script",
      "scripts": Object {
        "prepare": "node prepare.js",
      },
      "version": "1.0.0",
    },
  },
}
`

exports[`test/dir.js TAP with prepare script > extract 1`] = `
Object {
  "from": "file:test/fixtures/prepare-script",
  "integrity": "{integrity}",
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
  "_from": "file:test/fixtures/prepare-script",
  "_id": "git-prepare-script@1.0.0",
  "_integrity": null,
  "_resolved": "\${CWD}/test/fixtures/prepare-script",
  "devDependencies": Object {
    "abbrev": "^1.1.1",
  },
  "license": "ISC",
  "main": "index.js",
  "name": "git-prepare-script",
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
      "_from": "file:test/fixtures/prepare-script",
      "_id": "git-prepare-script@1.0.0",
      "_integrity": null,
      "_resolved": "\${CWD}/test/fixtures/prepare-script",
      "devDependencies": Object {
        "abbrev": "^1.1.1",
      },
      "dist": Object {
        "integrity": null,
        "tarball": "file:\${CWD}/test/fixtures/prepare-script",
      },
      "license": "ISC",
      "main": "index.js",
      "name": "git-prepare-script",
      "scripts": Object {
        "prepare": "node prepare.js",
      },
      "version": "1.0.0",
    },
  },
}
`
