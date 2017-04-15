# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="2.0.0"></a>
# [2.0.0](https://github.com/zkat/pacote/compare/v1.0.0...v2.0.0) (2017-04-15)


### Bug Fixes

* **api:** use npa[@5](https://github.com/5) for spec parsing (#78) ([3f56298](https://github.com/zkat/pacote/commit/3f56298))
* **deprecated:** remove underscore from manifest._deprecated ([9f4af93](https://github.com/zkat/pacote/commit/9f4af93))
* **directory:** add _resolved to directory manifests ([1d305db](https://github.com/zkat/pacote/commit/1d305db))
* **directory:** return null instead of throwing ([d35630d](https://github.com/zkat/pacote/commit/d35630d))
* **finalize:** don't try to cache manifests we can't get a good key for ([8ab1758](https://github.com/zkat/pacote/commit/8ab1758))
* **finalize:** refactored finalize-manifest code + add _integrity=false sentinel ([657b7fa](https://github.com/zkat/pacote/commit/657b7fa))
* **git:** cleaner handling of git tarball streams when caching ([11acd0a](https://github.com/zkat/pacote/commit/11acd0a))
* **git:** emit manifests from git tarball handler ([b139d4b](https://github.com/zkat/pacote/commit/b139d4b))
* **git:** fix .git exclusion, set mtime = 0 to make tarballs idempotent ([9a9fa1b](https://github.com/zkat/pacote/commit/9a9fa1b))
* **git:** fix fallback order and only fall back on hosted shortcuts ([551cb33](https://github.com/zkat/pacote/commit/551cb33))
* **git:** fix filling-out of git manifests ([95e807c](https://github.com/zkat/pacote/commit/95e807c))
* **git:** got dir packer option working with git ([7669b3e](https://github.com/zkat/pacote/commit/7669b3e))
* **headers:** nudge around some headers to make things behave ([db1e0a1](https://github.com/zkat/pacote/commit/db1e0a1))
* **manifest:** get rid of resolved-with-non-error warning ([d4d4917](https://github.com/zkat/pacote/commit/d4d4917))
* **manifest:** stop using digest for manifests ([4ddd2f5](https://github.com/zkat/pacote/commit/4ddd2f5))
* **opts:** bring opt-check up to date ([564419e](https://github.com/zkat/pacote/commit/564419e))
* **opts:** rename refreshCache to preferOnline cause much clearer ([94171d6](https://github.com/zkat/pacote/commit/94171d6))
* **prefetch:** fall back to the _integrity in the manifest if none calculated ([083ac79](https://github.com/zkat/pacote/commit/083ac79))
* **prefetch:** if there's no stream, just skip (for directory) ([714de91](https://github.com/zkat/pacote/commit/714de91))
* **registry:** fix error handling for registry tarballs ([e69539f](https://github.com/zkat/pacote/commit/e69539f))
* **registry:** nudging logging stuff around a bit ([61d62cc](https://github.com/zkat/pacote/commit/61d62cc))
* **registry:** only send auth info if tarball is hosted on the same registry ([1de5a2b](https://github.com/zkat/pacote/commit/1de5a2b))
* **registry:** redirect tarball urls to provided registry port+protocol if same host ([f50167e](https://github.com/zkat/pacote/commit/f50167e))
* **registry:** support memoizing packuments ([e7fff31](https://github.com/zkat/pacote/commit/e7fff31))
* **registry:** treat registry cache as "private" -- bumps m-f-h ([6fa1503](https://github.com/zkat/pacote/commit/6fa1503))


### Features

* **directory:** implement local dir packing ([017d989](https://github.com/zkat/pacote/commit/017d989))
* **fetch:** bump make-fetch-happen for new restarts ([cf90716](https://github.com/zkat/pacote/commit/cf90716))
* **git:** support pulling in git submodules ([5825d33](https://github.com/zkat/pacote/commit/5825d33))
* **integrity:** replace http client (#72) ([189cdd2](https://github.com/zkat/pacote/commit/189cdd2))
* **prefetch:** return cache-related info on prefetch ([623b7f3](https://github.com/zkat/pacote/commit/623b7f3))
* **registry:** allow injection of request agents ([805e5ae](https://github.com/zkat/pacote/commit/805e5ae))
* **registry:** fast request pooling ([321f84b](https://github.com/zkat/pacote/commit/321f84b))
* **registry:** registry requests now follow cache spec more closely, respect Age, etc ([9e47098](https://github.com/zkat/pacote/commit/9e47098))


### BREAKING CHANGES

* **api:** spec objects can no longer be realize-package-specifier objects. Pass a string or generate npa@>=5 spec objects to pass in.
* **integrity:** This PR replaces a pretty fundamental chunk of pacote.

* Caching now follows standard-ish cache rules for http-related requests.

* manifest() no longer includes the `_shasum` field. It's been replaced by `_integrity`, which is a Subresource Integrity hash string containing equivalent data. These strings can be parsed and managed using https://npm.im/ssri.

* Any functions that accepted `opts.digest` and/or `opts.hashAlgorithm` now expect `opts.integrity` instead.

* Packuments and finalized manifests are now cached using sha512. Tarballs can start using that hash (or any other more secure hash) once registries start supporting them: `packument.dist.integrity` will be prioritized over `packument.shasum`.

* If opts.offline is used, a `ENOCACHE` error will be returned.



<a name="1.0.0"></a>
# [1.0.0](https://github.com/zkat/pacote/compare/v0.1.1...v1.0.0) (2017-03-17)


### Bug Fixes

* **extract-stream:** adapt to tar-fs api ([aa21308](https://github.com/zkat/pacote/commit/aa21308))
* add 'use strict' to all .js files (#26) ([021bd59](https://github.com/zkat/pacote/commit/021bd59))
* **cache:** this is really a user error, so just throw ([5c9c0fa](https://github.com/zkat/pacote/commit/5c9c0fa))
* **deps:** cacache[@5](https://github.com/5).0.3 ([37cddc5](https://github.com/zkat/pacote/commit/37cddc5))
* **deps:** tar-fs[@1](https://github.com/1).15.1 ([e0d853a](https://github.com/zkat/pacote/commit/e0d853a))
* **docs:** correct fixtures table (#57) ([23d2eb4](https://github.com/zkat/pacote/commit/23d2eb4))
* **extract:** correctly detect digest cache misses ([ec6672b](https://github.com/zkat/pacote/commit/ec6672b))
* **extract:** fixed race condition ([14fd2a8](https://github.com/zkat/pacote/commit/14fd2a8))
* **finalize-manifest:** use digest to uniquify cached manifests ([931a9cb](https://github.com/zkat/pacote/commit/931a9cb))
* **http:** Fixed cache-related race condition ([b70a4b1](https://github.com/zkat/pacote/commit/b70a4b1))
* **manifest:** dir manifests should throw ENOPACKAGEJSON ([b06882d](https://github.com/zkat/pacote/commit/b06882d))
* **manifest:** ETARGET when no packages match ([ea2127d](https://github.com/zkat/pacote/commit/ea2127d))
* **manifest:** local manifest fn should return a promise ([c700622](https://github.com/zkat/pacote/commit/c700622))
* **manifest:** retry registry manifests once on ETARGET (#66) ([3b99adc](https://github.com/zkat/pacote/commit/3b99adc))
* **prefetch:** hashAlgorithm is required for hasContent ([f03d51c](https://github.com/zkat/pacote/commit/f03d51c))
* **request:** report cache write errors on end ([c102b86](https://github.com/zkat/pacote/commit/c102b86))


### Features

* **api:** support pre-realized specifiers as specs (#62) ([1d5bf39](https://github.com/zkat/pacote/commit/1d5bf39))
* **cache:** grabbing info and hasContent ([a559711](https://github.com/zkat/pacote/commit/a559711))
* **deps:** minimatch[@3](https://github.com/3).0.3 ([2bb8cd5](https://github.com/zkat/pacote/commit/2bb8cd5))
* **deps:** normalize-package-data[@2](https://github.com/2).3.5 ([4250e0d](https://github.com/zkat/pacote/commit/4250e0d))
* **directory:** directory dep support (#68) ([6d5307a](https://github.com/zkat/pacote/commit/6d5307a))
* **git:** baseline git support (#69) ([6d7eaf5](https://github.com/zkat/pacote/commit/6d7eaf5))
* **handlers:** added remote tarball support (#64) ([add1808](https://github.com/zkat/pacote/commit/add1808))
* **local:** local tarball support (#67) ([e50d625](https://github.com/zkat/pacote/commit/e50d625))
* **manifest:** handle deprecation notice (#60) ([db82dae](https://github.com/zkat/pacote/commit/db82dae))
* **manifest:** standardize manifest format ([3dd9a72](https://github.com/zkat/pacote/commit/3dd9a72))
* **manifest:** switch to cacache for caching ([8ba7249](https://github.com/zkat/pacote/commit/8ba7249))
* **prefetch:** added tarball prefetch support ([26c34ce](https://github.com/zkat/pacote/commit/26c34ce))
* **request:** accept maxSockets opt ([3987807](https://github.com/zkat/pacote/commit/3987807))
* **scopes:** new scopeTargets option (#59) ([b5db7ae](https://github.com/zkat/pacote/commit/b5db7ae))


### Performance Improvements

* **finalize-manifest:** cache finalized manifests ([fa3c430](https://github.com/zkat/pacote/commit/fa3c430))


### BREAKING CHANGES

* **manifest:** Toplevel APIs now return Promises instead of using callbacks.
