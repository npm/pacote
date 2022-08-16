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
      String(
        Pacote - The JavaScript Package Handler, v{VERSION}
        
        Usage:
        
          pacote resolve <spec>
            Resolve a specifier and output the fully resolved target
            Returns integrity and from if '--long' flag is set.
        
          pacote manifest <spec>
            Fetch a manifest and print to stdout
        
          pacote packument <spec>
            Fetch a full packument and print to stdout
        
          pacote tarball <spec> [<filename>]
            Fetch a package tarball and save to <filename>
            If <filename> is missing or '-', the tarball will be streamed to stdout.
        
          pacote extract <spec> <folder>
            Extract a package to the destination folder.
        
        Configuration values all match the names of configs passed to npm, or
        options passed to Pacote.  Additional flags for this executable:
        
          --long     Print an object from 'resolve', including integrity and spec.
          --json     Print result objects as JSON rather than node's default.
                     (This is the default if stdout is not a TTY.)
          --help -h  Print this helpful text.
        
        For example '--cache=/path/to/folder' will use that folder as the cache.
        
      ),
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
      String(
        Pacote - The JavaScript Package Handler, v{VERSION}
        
        Usage:
        
          pacote resolve <spec>
            Resolve a specifier and output the fully resolved target
            Returns integrity and from if '--long' flag is set.
        
          pacote manifest <spec>
            Fetch a manifest and print to stdout
        
          pacote packument <spec>
            Fetch a full packument and print to stdout
        
          pacote tarball <spec> [<filename>]
            Fetch a package tarball and save to <filename>
            If <filename> is missing or '-', the tarball will be streamed to stdout.
        
          pacote extract <spec> <folder>
            Extract a package to the destination folder.
        
        Configuration values all match the names of configs passed to npm, or
        options passed to Pacote.  Additional flags for this executable:
        
          --long     Print an object from 'resolve', including integrity and spec.
          --json     Print result objects as JSON rather than node's default.
                     (This is the default if stdout is not a TTY.)
          --help -h  Print this helpful text.
        
        For example '--cache=/path/to/folder' will use that folder as the cache.
        
      ),
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
      String(
        {
          "method": "extract",
          "spec": "npm@latest-6",
          "dest": "folder",
          "conf": {
            "_": [
              "extract",
              "npm@latest-6",
              "folder"
            ],
            "cache": "{HOME}/.npm/_cacache",
            "json": true
          }
        }
      ),
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
      String(
        {
          "method": "manifest",
          "spec": "bar@foo",
          "conf": {
            "_": [
              "manifest",
              "bar@foo"
            ],
            "cache": "{HOME}/.npm/_cacache"
          },
          "_resolved": "manifest resolved",
          "_integrity": "manifest integrity",
          "_from": "manifest from"
        }
      ),
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
      String(
        {
          "method": "packument",
          "spec": "paku@mint",
          "conf": {
            "_": [
              "packument",
              "paku@mint"
            ],
            "cache": "{HOME}/.npm/_cacache"
          }
        }
      ),
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

exports[`test/bin.js TAP main resolve foo@bar --long > must match snapshot 1`] = `
Object {
  "errorlog": Array [],
  "exitlog": Array [],
  "loglog": Array [
    Array [
      String(
        {
          "resolved": "manifest resolved",
          "integrity": "manifest integrity",
          "from": "manifest from"
        }
      ),
    ],
  ],
}
`

exports[`test/bin.js TAP main resolve foo@bar > must match snapshot 1`] = `
Object {
  "errorlog": Array [],
  "exitlog": Array [],
  "loglog": Array [
    Array [
      String(
        {
          "method": "resolve",
          "spec": "foo@bar",
          "conf": {
            "_": [
              "resolve",
              "foo@bar"
            ],
            "cache": "{HOME}/.npm/_cacache"
          }
        }
      ),
    ],
  ],
}
`

exports[`test/bin.js TAP main resolve string --json > must match snapshot 1`] = `
Object {
  "errorlog": Array [],
  "exitlog": Array [],
  "loglog": Array [
    Array [
      "\\"just a string\\"",
    ],
  ],
}
`

exports[`test/bin.js TAP main resolve string > must match snapshot 1`] = `
Object {
  "errorlog": Array [],
  "exitlog": Array [],
  "loglog": Array [
    Array [
      "just a string",
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
      String(
        {
          "method": "tarball",
          "spec": "tar@ball",
          "file": "file.tgz",
          "conf": {
            "_": [
              "tarball",
              "tar@ball",
              "file.tgz"
            ],
            "cache": "{HOME}/.npm/_cacache"
          }
        }
      ),
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
  "_from": "manifest from",
  "_integrity": "manifest integrity",
  "_resolved": "manifest resolved",
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
false
`

exports[`test/bin.js TAP running bin runs main file > helpful output 1`] = `
Pacote - The JavaScript Package Handler, v{VERSION}

Usage:

  pacote resolve <spec>
    Resolve a specifier and output the fully resolved target
    Returns integrity and from if '--long' flag is set.

  pacote manifest <spec>
    Fetch a manifest and print to stdout

  pacote packument <spec>
    Fetch a full packument and print to stdout

  pacote tarball <spec> [<filename>]
    Fetch a package tarball and save to <filename>
    If <filename> is missing or '-', the tarball will be streamed to stdout.

  pacote extract <spec> <folder>
    Extract a package to the destination folder.

Configuration values all match the names of configs passed to npm, or
options passed to Pacote.  Additional flags for this executable:

  --long     Print an object from 'resolve', including integrity and spec.
  --json     Print result objects as JSON rather than node's default.
             (This is the default if stdout is not a TTY.)
  --help -h  Print this helpful text.

For example '--cache=/path/to/folder' will use that folder as the cache.


`
