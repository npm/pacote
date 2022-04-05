# Changelog

### [13.0.6](https://github.com/npm/pacote/compare/v13.0.5...v13.0.6) (2022-04-05)


### Bug Fixes

* replace deprecated String.prototype.substr() ([e307e17](https://github.com/npm/pacote/commit/e307e17e0784cd9d5f5965dc4c20a7ce228b3f46))


### Dependencies

* bump @npmcli/promise-spawn from 1.3.2 to 3.0.0 ([#154](https://github.com/npm/pacote/issues/154)) ([9a0ec63](https://github.com/npm/pacote/commit/9a0ec63d1c78a34bfef00e0c58f24151d2409975))
* bump ssri from 8.0.1 to 9.0.0 ([#157](https://github.com/npm/pacote/issues/157)) ([0993b18](https://github.com/npm/pacote/commit/0993b186d538795fa72d392308494aecb729d315))

### [13.0.5](https://www.github.com/npm/pacote/compare/v13.0.4...v13.0.5) (2022-03-15)


### Dependencies

* bump read-package-json from 4.1.2 to 5.0.0 ([#138](https://www.github.com/npm/pacote/issues/138)) ([f28c891](https://www.github.com/npm/pacote/commit/f28c8911c4e7af0368dba07be7492eaa109bc08b))

### [13.0.4](https://www.github.com/npm/pacote/compare/v13.0.3...v13.0.4) (2022-03-14)


### Dependencies

* bump cacache from 15.3.0 to 16.0.0 ([#136](https://www.github.com/npm/pacote/issues/136)) ([ed3a069](https://www.github.com/npm/pacote/commit/ed3a069d6aad378cf35a24d64db6eea778b833a2))
* bump npm-packlist from 3.0.0 to 4.0.0 ([#132](https://www.github.com/npm/pacote/issues/132)) ([1634e9d](https://www.github.com/npm/pacote/commit/1634e9d2deac45297e4a120b4ccb4984119e41e4))
* update @npmcli/run-script requirement from ^3.0.0 to ^3.0.1 ([#130](https://www.github.com/npm/pacote/issues/130)) ([7c84792](https://www.github.com/npm/pacote/commit/7c84792bef5b0f3825682ec97d14006638c1ed78))
* update npm-registry-fetch requirement from ^13.0.0 to ^13.0.1 ([#129](https://www.github.com/npm/pacote/issues/129)) ([d639ed6](https://www.github.com/npm/pacote/commit/d639ed6b6ff11f0e24efa27bf77b1b17269ae98d))
* update read-package-json requirement from ^4.1.1 to ^4.1.2 ([#134](https://www.github.com/npm/pacote/issues/134)) ([31093a1](https://www.github.com/npm/pacote/commit/31093a17fca24b33a259cef54a166cf2141f71d4))

### [13.0.3](https://www.github.com/npm/pacote/compare/v13.0.2...v13.0.3) (2022-02-23)


### Bug Fixes

* ignore integrity values for git dependencies ([#123](https://www.github.com/npm/pacote/issues/123)) ([3417714](https://www.github.com/npm/pacote/commit/3417714f84a7599adffdd3a19730c8643103282f))


### Dependencies

* bump @npmcli/run-script from 2.0.0 to 3.0.0 ([#124](https://www.github.com/npm/pacote/issues/124)) ([6026b73](https://www.github.com/npm/pacote/commit/6026b736442d703fb650b605e22125e926b9a03c))

### [13.0.2](https://www.github.com/npm/pacote/compare/v13.0.1...v13.0.2) (2022-02-16)


### Bug Fixes

* run prepack lifecycle scripts on git fetcher ([#121](https://www.github.com/npm/pacote/issues/121)) ([82d8afc](https://www.github.com/npm/pacote/commit/82d8afccf6d17e584e281089edc727a8523eee77))


### Dependencies

* bump @npmcli/git from 2.1.0 to 3.0.0 ([#120](https://www.github.com/npm/pacote/issues/120)) ([56d0c62](https://www.github.com/npm/pacote/commit/56d0c62295d726fe9482a669a50cff92775b9ead))

### [13.0.1](https://www.github.com/npm/pacote/compare/v13.0.0...v13.0.1) (2022-02-16)


### Bug Fixes

* reify git dependencies that have workspaces ([#103](https://www.github.com/npm/pacote/issues/103)) ([08348fa](https://www.github.com/npm/pacote/commit/08348faa6516382262e2199f19a0865df9f11735))


### Dependencies

* bump npm-registry-fetch from 12.0.2 to 13.0.0 ([#118](https://www.github.com/npm/pacote/issues/118)) ([25eeb97](https://www.github.com/npm/pacote/commit/25eeb97cdbe5285ff09230ece9e5be61d86ccbeb))

## [13.0.0](https://www.github.com/npm/pacote/compare/v12.0.3...v13.0.0) (2022-02-14)


### ⚠ BREAKING CHANGES

* It replaces the only use of `npmlog.level` with a boolean `silent` which is now used to to suppress `@npmcli/run-script` banners instead.

### Features

* add fullReadJson option ([#101](https://www.github.com/npm/pacote/issues/101)) ([2ddf67f](https://www.github.com/npm/pacote/commit/2ddf67f7c4e084ffec315f94e30bb24f944403e3))
* use proc-log and drop support for `log` property ([#104](https://www.github.com/npm/pacote/issues/104)) ([26e01b0](https://www.github.com/npm/pacote/commit/26e01b053236f30288a0e4178ff88b52c56d2484))


### Dependencies

* bump npm-package-arg from 8.1.5 to 9.0.0 ([#113](https://www.github.com/npm/pacote/issues/113)) ([5b3b82d](https://www.github.com/npm/pacote/commit/5b3b82d19d31c33710b6bacb56d291b335a4bc3b))
* bump npm-pick-manifest from 6.1.1 to 7.0.0 ([3940b46](https://www.github.com/npm/pacote/commit/3940b467057dc0e1fe4e7ecec0317008f0fadd23))
* update @npmcli/installed-package-contents requirement ([0413eff](https://www.github.com/npm/pacote/commit/0413efff7825263a97d6c4f530254213c7c3e49d))
* update cacache requirement from ^15.0.5 to ^15.3.0 ([#112](https://www.github.com/npm/pacote/issues/112)) ([0321cf0](https://www.github.com/npm/pacote/commit/0321cf00c09dd9d5cebe51c305522ac294ddb966))
* update minipass requirement from ^3.1.3 to ^3.1.6 ([#115](https://www.github.com/npm/pacote/issues/115)) ([9548c8c](https://www.github.com/npm/pacote/commit/9548c8cb3a068d1edde3bf7d81745abe00046047))
* update mkdirp requirement from ^1.0.3 to ^1.0.4 ([c204aa2](https://www.github.com/npm/pacote/commit/c204aa25ff95118ba8847d7b55565059ab4d2918))
* update npm-registry-fetch requirement from ^12.0.0 to ^12.0.2 ([97e7ab5](https://www.github.com/npm/pacote/commit/97e7ab5f954dca6c9b20d3ab53ad1cb6f6775d06))
* update read-package-json-fast requirement from ^2.0.1 to ^2.0.3 ([be32161](https://www.github.com/npm/pacote/commit/be3216160bbd48422545cf721913311bd52aa657))
* update tar requirement from ^6.1.0 to ^6.1.11 ([#107](https://www.github.com/npm/pacote/issues/107)) ([650e188](https://www.github.com/npm/pacote/commit/650e18890cf7e319f77cf240b03cb7464be4e046))
