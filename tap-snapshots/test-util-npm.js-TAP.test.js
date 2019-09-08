/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/util/npm.js TAP do the things > expect resolving Promise 1`] = `
Object {
  "args": Array [
    "/path/to/npm/bin/npm-cli.js",
    "flerb",
  ],
  "cmd": "/usr/local/bin/node",
  "stderr": "",
  "stdout": "[\\"/usr/local/bin/node\\",[\\"/path/to/npm/bin/npm-cli.js\\",\\"flerb\\"],{\\"cwd\\":\\"/cwd\\"}]",
}
`

exports[`test/util/npm.js TAP do the things > expect resolving Promise 2`] = `
Object {
  "args": Array [
    "flerb",
  ],
  "cmd": "/path/to/npm",
  "stderr": "",
  "stdout": "[\\"/path/to/npm\\",[\\"flerb\\"],{\\"cwd\\":\\"/cwd\\"}]",
}
`
