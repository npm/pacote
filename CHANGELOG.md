# Changelog

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
