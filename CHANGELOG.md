# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
