/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/bin.js TAP main --help > must match snapshot 1`] = `
Object {
  "errorlog": Array [],
  "exitlog": Array [],
  "loglog": Array [
    Array [
      "Pacote - The JavaScript Package Handler, v{VERSION}\\n\\nUsage:\\n\\n  pacote resolve <spec>\\n    Resolve a specifier and output the fully resolved target\\n\\n  pacote manifest <spec>\\n    Fetch a manifest and print to stdout\\n\\n  pacote packument <spec>\\n    Fetch a full packument and print to stdout\\n\\n  pacote tarball <spec> [<filename>]\\n    Fetch a package tarball and save to <filename>\\n    If <filename> is missing or '-', the tarball will be streamed to stdout.\\n\\n  pacote extract <spec> <folder>\\n    Extract a package to the destination folder.\\n\\nConfiguration values all match the names of configs passed to npm, or options\\npassed to Pacote.\\n\\nFor example '--cache=/path/to/folder' will use that folder as the cache.\\n",
    ],
  ],
}
`

exports[`test/bin.js TAP main blerg glorb glork > must match snapshot 1`] = `
Object {
  "errorlog": Array [
    Array [
      "bad command: blerg",
    ],
    Array [
      "Pacote - The JavaScript Package Handler, v{VERSION}\\n\\nUsage:\\n\\n  pacote resolve <spec>\\n    Resolve a specifier and output the fully resolved target\\n\\n  pacote manifest <spec>\\n    Fetch a manifest and print to stdout\\n\\n  pacote packument <spec>\\n    Fetch a full packument and print to stdout\\n\\n  pacote tarball <spec> [<filename>]\\n    Fetch a package tarball and save to <filename>\\n    If <filename> is missing or '-', the tarball will be streamed to stdout.\\n\\n  pacote extract <spec> <folder>\\n    Extract a package to the destination folder.\\n\\nConfiguration values all match the names of configs passed to npm, or options\\npassed to Pacote.\\n\\nFor example '--cache=/path/to/folder' will use that folder as the cache.\\n",
    ],
  ],
  "exitlog": Array [],
  "loglog": Array [],
}
`

exports[`test/bin.js TAP main extract npm@latest-6 folder --json > must match snapshot 1`] = `
Object {
  "errorlog": Array [],
  "exitlog": Array [],
  "loglog": Array [
    Array [
      "{\\n  \\"method\\": \\"extract\\",\\n  \\"spec\\": \\"npm@latest-6\\",\\n  \\"dest\\": \\"folder\\",\\n  \\"conf\\": {\\n    \\"_\\": [\\n      \\"extract\\",\\n      \\"npm@latest-6\\",\\n      \\"folder\\"\\n    ],\\n    \\"json\\": true,\\n    \\"cache\\": \\"{HOME}/.npm/_cacache\\"\\n  }\\n}",
    ],
  ],
}
`

exports[`test/bin.js TAP main extract npm@latest-6 folder --no-json > must match snapshot 1`] = `
Object {
  "errorlog": Array [],
  "exitlog": Array [],
  "loglog": Array [
    Array [
      Object {
        "conf": Object {
          "_": Array [
            "extract",
            "npm@latest-6",
            "folder",
          ],
          "cache": "{HOME}/.npm/_cacache",
          "json": false,
        },
        "dest": "folder",
        "method": "extract",
        "spec": "npm@latest-6",
      },
    ],
  ],
}
`

exports[`test/bin.js TAP main manifest bar@foo > must match snapshot 1`] = `
Object {
  "errorlog": Array [],
  "exitlog": Array [],
  "loglog": Array [
    Array [
      "{\\n  \\"method\\": \\"manifest\\",\\n  \\"spec\\": \\"bar@foo\\",\\n  \\"conf\\": {\\n    \\"_\\": [\\n      \\"manifest\\",\\n      \\"bar@foo\\"\\n    ],\\n    \\"json\\": true,\\n    \\"cache\\": \\"{HOME}/.npm/_cacache\\"\\n  }\\n}",
    ],
  ],
}
`

exports[`test/bin.js TAP main packument paku@mint > must match snapshot 1`] = `
Object {
  "errorlog": Array [],
  "exitlog": Array [],
  "loglog": Array [
    Array [
      "{\\n  \\"method\\": \\"packument\\",\\n  \\"spec\\": \\"paku@mint\\",\\n  \\"conf\\": {\\n    \\"_\\": [\\n      \\"packument\\",\\n      \\"paku@mint\\"\\n    ],\\n    \\"json\\": true,\\n    \\"cache\\": \\"{HOME}/.npm/_cacache\\"\\n  }\\n}",
    ],
  ],
}
`

exports[`test/bin.js TAP main resolve fail > must match snapshot 1`] = `
Object {
  "errorlog": Array [
    Array [
      Error: fail,
    ],
  ],
  "exitlog": Array [
    1,
  ],
  "loglog": Array [],
}
`

exports[`test/bin.js TAP main resolve foo@bar > must match snapshot 1`] = `
Object {
  "errorlog": Array [],
  "exitlog": Array [],
  "loglog": Array [
    Array [
      "{\\n  \\"method\\": \\"resolve\\",\\n  \\"spec\\": \\"foo@bar\\",\\n  \\"conf\\": {\\n    \\"_\\": [\\n      \\"resolve\\",\\n      \\"foo@bar\\"\\n    ],\\n    \\"json\\": true,\\n    \\"cache\\": \\"{HOME}/.npm/_cacache\\"\\n  }\\n}",
    ],
  ],
}
`

exports[`test/bin.js TAP main tarball tar@ball file.tgz > must match snapshot 1`] = `
Object {
  "errorlog": Array [],
  "exitlog": Array [],
  "loglog": Array [
    Array [
      "{\\n  \\"method\\": \\"tarball\\",\\n  \\"spec\\": \\"tar@ball\\",\\n  \\"file\\": \\"file.tgz\\",\\n  \\"conf\\": {\\n    \\"_\\": [\\n      \\"tarball\\",\\n      \\"tar@ball\\",\\n      \\"file.tgz\\"\\n    ],\\n    \\"json\\": true,\\n    \\"cache\\": \\"{HOME}/.npm/_cacache\\"\\n  }\\n}",
    ],
  ],
}
`

exports[`test/bin.js TAP run > expect resolving Promise 1`] = `
Object {
  "conf": Object {
    "_": Array [
      "resolve",
      "spec",
    ],
    "some": "configs",
  },
  "method": "resolve",
  "spec": "spec",
}
`

exports[`test/bin.js TAP run > expect resolving Promise 2`] = `
Object {
  "conf": Object {
    "_": Array [
      "manifest",
      "spec",
    ],
    "some": "configs",
  },
  "method": "manifest",
  "spec": "spec",
}
`

exports[`test/bin.js TAP run > expect resolving Promise 3`] = `
Object {
  "conf": Object {
    "_": Array [
      "packument",
      "spec",
    ],
    "some": "configs",
  },
  "method": "packument",
  "spec": "spec",
}
`

exports[`test/bin.js TAP run > expect resolving Promise 4`] = `
Object {
  "conf": Object {
    "_": Array [
      "tarball",
      "spec",
      "file",
    ],
    "some": "configs",
  },
  "file": "file",
  "method": "tarball",
  "spec": "spec",
}
`

exports[`test/bin.js TAP run > expect resolving Promise 5`] = `
Object {
  "conf": Object {
    "_": Array [
      "extract",
      "spec",
      "dest",
    ],
    "some": "configs",
  },
  "dest": "dest",
  "method": "extract",
  "spec": "spec",
}
`

exports[`test/bin.js TAP run > expect resolving Promise 6`] = `
undefined
`

exports[`test/bin.js TAP running bin runs main file > helpful output 1`] = `
Pacote - The JavaScript Package Handler, v{VERSION}

Usage:

  pacote resolve <spec>
    Resolve a specifier and output the fully resolved target

  pacote manifest <spec>
    Fetch a manifest and print to stdout

  pacote packument <spec>
    Fetch a full packument and print to stdout

  pacote tarball <spec> [<filename>]
    Fetch a package tarball and save to <filename>
    If <filename> is missing or '-', the tarball will be streamed to stdout.

  pacote extract <spec> <folder>
    Extract a package to the destination folder.

Configuration values all match the names of configs passed to npm, or options
passed to Pacote.

For example '--cache=/path/to/folder' will use that folder as the cache.


`
