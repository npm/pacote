/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/fetcher.js TAP make bins executable > results of unpack 1`] = `
Object {
  "from": "file:test/fixtures/bin-object.tgz",
  "integrity": "sha512-TqzCjecWyQe8vqLbT0nv/OaWf0ptRZ2DnPmiuGUYJJb70shp02+/uu37IJSkM2ZEP1SAOeKrYrWPVIIYW+d//g==",
  "resolved": "{CWD}/test/fixtures/bin-object.tgz",
}
`

exports[`test/fetcher.js TAP snapshot the npmInstallCmd and npmInstallConfig > customized npmInstallCmd 1`] = `
Array [
  "install",
  "blerg",
]
`

exports[`test/fetcher.js TAP snapshot the npmInstallCmd and npmInstallConfig > default install cmd 1`] = `
Array [
  "install",
  "--force",
]
`

exports[`test/fetcher.js TAP snapshot the npmInstallCmd and npmInstallConfig > default install cmd with before 1`] = `
Array [
  "install",
  "--force",
]
`

exports[`test/fetcher.js TAP snapshot the npmInstallCmd and npmInstallConfig > default install config 1`] = `
Array [
  "--cache={CACHE}",
  "--prefer-offline=false",
  "--prefer-online=false",
  "--offline=false",
  "--no-progress",
  "--no-save",
  "--no-audit",
  "--include=dev",
  "--include=peer",
  "--include=optional",
  "--no-package-lock-only",
  "--no-dry-run",
]
`

exports[`test/fetcher.js TAP snapshot the npmInstallCmd and npmInstallConfig > default install config with before 1`] = `
Array [
  "--cache={CACHE}",
  "--prefer-offline=false",
  "--prefer-online=false",
  "--offline=false",
  "--before=1979-07-01T19:10:00.000Z",
  "--no-progress",
  "--no-save",
  "--no-audit",
  "--include=dev",
  "--include=peer",
  "--include=optional",
  "--no-package-lock-only",
  "--no-dry-run",
]
`

exports[`test/fetcher.js TAP snapshot the npmInstallCmd and npmInstallConfig > yarn style cli config stuff 1`] = `
Array [
  "--some",
  "--yarn",
  "--stuff",
]
`
