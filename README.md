# pacote [![npm version](https://img.shields.io/npm/v/pacote.svg)](https://npm.im/pacote) [![license](https://img.shields.io/npm/l/pacote.svg)](https://npm.im/pacote) [![Travis](https://img.shields.io/travis/zkat/pacote.svg)](https://travis-ci.org/zkat/pacote) [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/zkat/pacote?svg=true)](https://ci.appveyor.com/project/zkat/pacote) [![Coverage Status](https://coveralls.io/repos/github/zkat/pacote/badge.svg?branch=latest)](https://coveralls.io/github/zkat/pacote?branch=latest)


**NOTE: this package is still under heavy development. Please don't use it yet**

[`pacote`](https://github.com/zkat/pacote) is a Node.js library for downloading
[npm](https://npmjs.org)-compatible packages. It supports all package specifier
syntax that `npm install` and its ilk support. It transparently caches anything
needed to reduce excess operations, using [`cacache`](https://npm.im/cacache).

## Install

`$ npm install --save pacote`

## Table of Contents

* [Example](#example)
* [Features](#features)
* [Guide](#guide)
* [API](#api)
  * [`metadata`](#metadata)
  * [`manifest`](#manifest)
  * [`extract`](#extract)
  * [`options`](#options)

### Example

```javascript
const pacote = require('pacote')

pacote.metadata('pacote', function (err, meta) {
  console.log(meta.versions) // ['0.0.0', '1.0.0']
  console.log(meta['dist-tags']) // { latest: '1.0.0' }
  console.log(meta.dist.shasum) // 'deadbeef'
})

pacote.manifest('github:zkat/pacote', function (err, pkg) {
  console.log('package.json from github: ', pkg)
  // { "name": "pacote", "version": "1.0.0", ... }
})

pacote.extract('http://hi.com/pkg.tgz', 'deadbeef', './-here', function (err) {
  console.log('if `deadbeef` is present in the cache, network is skipped')
  console.log('tarball contents extracted to ./here')
})
```

### Features

* simple interface to common package-related actions.
* supports all package types.
* fault-tolerant, fast, content-addressable cache.
* authentication support (private git, private npm registries, etc)
* npm-compatible for all relevant operations
* github, gitlab, and bitbucket-aware
* version/tag aware when fetching from git repositories.
* caches git repositories

### Guide

#### Introduction

### API

#### <a name="metadata"></a> `> pacote.metadata(spec, opts, cb)`

Fetches the full metadata available for the package specified by `<spec>`.

All valid metadata includes the following fields:

* `name`
* `version`
* `_shasum`

The following fields are included as long as the package specified by `spec`
also includes them. Values will be from whichever version was specified.

* `dependencies`
* `devDependencies`
* `optionalDependencies`
* `peerDependencies`
* `bundleDependencies`
* `hasShrinkwrap`

git and registry packages have two additional fields:

* `versions` - all available versions for this package
* `dist-tags` - tags/dist-tags associated with the package

##### Example

```javascript
pacote.metadata('pacote@1.0.0', function (err, info) {
  // fetched from registry
})

pacote.metadata('github:zkat/pacote', function (err, info) {
  // fetched from github
})

pacote.metadata('./path/to/tarball.tgz', function (err, info) {
  // fetched from local tarball
})
```

#### <a name="manifest"></a> `> pacote.manifest(spec, [opts], cb)`

Fetches the *manifest* for a package, aka `package.json`. This is a more limited
request than `metadata` and will even be read from cache if a `cache` option was
provided and the spec type is cacheable. This will not write to the cache,
though -- a full download is required to associate a manifest with a package.

Note that depending on the spec type, some additional fields might be present.
For example, packages from `registry.npmjs.org` have additional metadata
appended by the registry.

The `_shasum` field will always be present for already-cached packages: if you
find this field, the package tarball will be cached and ready to extract, barring cache corruption or race conditions (so prepare to do a named extract)

##### Example

```javascript
pacote.manifest('pacote@1.0.0', function (err, pkgJson) {
  // fetched `package.json` data from the registry (or cache, if cached)
})
```

#### <a name="extract"></a> `> pacote.extract(spec, destination, [opts], cb)`

Extracts package data identified by `<spec>` into a directory named
`<destination>`, which will be created if it does not already exist.

If `opts.digest` is provided and the data it identifies is present in the cache,
`extract` will bypass most of its operations and go straight to extracting the
tarball.

##### Example

```javascript
pacote.extract('pacote@1.0.0', './woot', {
  digest: 'deadbeef'
}, function (err) {
  // Succeeds as long as `pacote@1.0.0` still exists somewhere. Network and
  // other operations are bypassed entirely if `digest` is present in the cache.
})
```

#### <a name="options"></a> `> options`

##### `opts.digest`

If provided, pacote will confirm that the relevant `shasum` for each operation's
results matches the given digest. The call will return `EBADCHECKSUM` if the
check fails.

Additionally, `pacote.extract` will check the cache before performing any other
operations.

##### `opts.cache`
##### `opts.cacheUid`/`opts.cacheGid`
##### `opts.uid`/`opts.gid`
##### `opts.scope`
##### `opts.registry`
##### `opts.@somescope:registry`
##### `opts.auth`
##### `opts.log`

Default: `silentNpmLog`

An [`npmlog`](https://npm.im/npmlog)-compatible logger. Will be used to log
various events at the levels specified by `npmlog`.
