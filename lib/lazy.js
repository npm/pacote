let git
let npa
let pickManifest
let crypto
let runScript
let minipass
let tar
let npmPackList
let fileFetcher
let cacache
let ssri
let packageJson
let fsm
let fetchObj
let sigstore
module.exports = {
  createCryptoVerify (alg) {
    return (crypto ??= require('node:crypto')).createVerify(alg)
  },
  /** @returns {import('@npmcli/git')} */
  lazyGit () {
    return git ??= require('@npmcli/git')
  },
  /** @returns {import('npm-package-arg')} */
  lazyNpa () {
    return npa ??= require('npm-package-arg')
  },
  /** @returns {import('npm-pick-manifest')} */
  lazyPickManifest () {
    return pickManifest ??= require('npm-pick-manifest')
  },
  /** @returns {import('@npmcli/run-script')} */
  lazyRunScript () {
    return runScript ??= require('@npmcli/run-script')
  },
  /** @returns {import('minipass')} */
  lazyMinipass () {
    return minipass ??= require('minipass')
  },
  /** @returns {import('tar')} */
  lazyTar () {
    return tar ??= require('tar')
  },
  /** @returns {import('npm-packlist')} */
  lazyNpmPacklist () {
    return npmPackList ??= require('npm-packlist')
  },
  /** @returns {import('./file.js')} */
  lazyFileFetcher () {
    return fileFetcher ??= require('./file.js')
  },
  /** @returns {import('cacache')} */
  lazyCacache () {
    return cacache ??= require('cacache')
  },
  /** @returns {import('ssri')} */
  lazySsri () {
    return ssri ??= require('ssri')
  },
  /** @returns {import('@npmcli/package-json')} */
  lazyPackageJson () {
    return packageJson ??= require('@npmcli/package-json')
  },
  /** @returns {import('fs-minipass')} */
  lazyFsm () {
    return fsm ??= require('fs-minipass')
  },
  /** @returns {import('npm-registry-fetch')} */
  lazyFetch () {
    return fetchObj ??= require('npm-registry-fetch')
  },
  lazySigstore () {
    return sigstore ??= require('sigstore')
  },
}
