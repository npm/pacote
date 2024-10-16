# Changelog

## [19.0.1](https://github.com/npm/pacote/compare/v19.0.0...v19.0.1) (2024-10-15)
### Bug Fixes
* [`cbf94e8`](https://github.com/npm/pacote/commit/cbf94e8b0486e80f8f2e4c9ed7c7d18c3282096b) [#389](https://github.com/npm/pacote/pull/389) prepare script respects scriptshell config (#389) (@milaninfy)
* [`2b2948f`](https://github.com/npm/pacote/commit/2b2948faaebff35dd469c653e76517887f6e119d) [#403](https://github.com/npm/pacote/pull/403) log tarball retrieval from cache (#403) (@mbtools, @wraithgar)
### Dependencies
* [`a9fc4d1`](https://github.com/npm/pacote/commit/a9fc4d13ad4b28bb64ae92077ce6d35d2c130125) [#405](https://github.com/npm/pacote/pull/405) bump sigstore from 2.2.0 to 3.0.0 (#405) (@bdehamer)

## [19.0.0](https://github.com/npm/pacote/compare/v18.0.6...v19.0.0) (2024-09-27)
### ⚠️ BREAKING CHANGES
* `pacote` now supports node `^18.17.0 || >=20.5.0`
### Bug Fixes
* [`03b31ca`](https://github.com/npm/pacote/commit/03b31cacfe3833a2e435ed50237dfee8014538ae) [#392](https://github.com/npm/pacote/pull/392) align to npm 10 node engine range (@reggi)
### Dependencies
* [`f055f71`](https://github.com/npm/pacote/commit/f055f71f3477f5ce234a42f559e53239cd1dd949) [#395](https://github.com/npm/pacote/pull/395) bump npm-pick-manifest from 9.1.0 to 10.0.0 (#395) (@dependabot[bot])
* [`932b9ab`](https://github.com/npm/pacote/commit/932b9ab4d133b39b96a03e73d97e08c2f43494f7) [#396](https://github.com/npm/pacote/pull/396) bump @npmcli/package-json from 5.2.1 to 6.0.0 (#396) (@dependabot[bot])
* [`a1621f9`](https://github.com/npm/pacote/commit/a1621f94537af0e71e66d293d35ff482e4eef0b5) [#397](https://github.com/npm/pacote/pull/397) bump npm-registry-fetch from 17.1.0 to 18.0.0 (#397) (@dependabot[bot])
* [`c776199`](https://github.com/npm/pacote/commit/c7761995fb79bd6c5b987127f331c7df199833dd) [#398](https://github.com/npm/pacote/pull/398) bump cacache from 18.0.4 to 19.0.0 (#398) (@dependabot[bot])
* [`6d59022`](https://github.com/npm/pacote/commit/6d590229d709005ec0ed841fa1f4cdf110cffb86) [#399](https://github.com/npm/pacote/pull/399) bump @npmcli/git from 5.0.8 to 6.0.0 (#399)
* [`21ea2d4`](https://github.com/npm/pacote/commit/21ea2d49ce6dd76ffc08540a1670da79126199fb) [#400](https://github.com/npm/pacote/pull/400) bump @npmcli/run-script from 8.1.0 to 9.0.0 (#400)
* [`eddbc01`](https://github.com/npm/pacote/commit/eddbc01e5cbd164437effbe7886385e875517cbf) [#392](https://github.com/npm/pacote/pull/392) `ssri@12.0.0`
* [`6c672e9`](https://github.com/npm/pacote/commit/6c672e99cb33224bfa4d7388d772083364bba293) [#392](https://github.com/npm/pacote/pull/392) `proc-log@5.0.0`
* [`03ba2a2`](https://github.com/npm/pacote/commit/03ba2a21f1d2b6a67813f6dad2459d184a8d6566) [#392](https://github.com/npm/pacote/pull/392) `npm-packlist@9.0.0`
* [`2710286`](https://github.com/npm/pacote/commit/2710286f44625474af23a529c12ea3c8b0cbf4aa) [#392](https://github.com/npm/pacote/pull/392) `npm-package-arg@12.0.0`
* [`aa0bd4a`](https://github.com/npm/pacote/commit/aa0bd4aaf59d2d3c34da33352293ad2774e3d915) [#392](https://github.com/npm/pacote/pull/392) `@npmcli/promise-spawn@8.0.0`
* [`df23343`](https://github.com/npm/pacote/commit/df233432a6ac4c25b8744d429f5e7e358b24abea) [#392](https://github.com/npm/pacote/pull/392) `@npmcli/installed-package-contents@3.0.0`
### Chores
* [`e4ed5cd`](https://github.com/npm/pacote/commit/e4ed5cd66c4bb4c4faef4a511b6d48c72d49470b) [#392](https://github.com/npm/pacote/pull/392) bump hosted-git-info ^7.0.0 to ^8.0.0 (@reggi)
* [`2871f56`](https://github.com/npm/pacote/commit/2871f569064ebaf4a1ae73a42d502e3876d0a18b) [#392](https://github.com/npm/pacote/pull/392) run template-oss-apply (@reggi)
* [`39643f1`](https://github.com/npm/pacote/commit/39643f1e956f83dd84f7f0ab6278f7051a69b32d) [#382](https://github.com/npm/pacote/pull/382) bump @npmcli/eslint-config from 4.0.5 to 5.0.0 (@dependabot[bot])
* [`7e33c82`](https://github.com/npm/pacote/commit/7e33c829b0143c9a22f1418d6f29f9a7aac03d00) [#383](https://github.com/npm/pacote/pull/383) postinstall for dependabot template-oss PR (@hashtagchris)
* [`e4e07bf`](https://github.com/npm/pacote/commit/e4e07bfb37190ef8c129ca6a643b91a4099560d8) [#383](https://github.com/npm/pacote/pull/383) bump @npmcli/template-oss from 4.23.1 to 4.23.3 (@dependabot[bot])

## [18.0.6](https://github.com/npm/pacote/compare/v18.0.5...v18.0.6) (2024-05-07)

### Bug Fixes

* [`79441a5`](https://github.com/npm/pacote/commit/79441a5cce9bc9927ae3e439188c2add5fa70d89) [#371](https://github.com/npm/pacote/pull/371) clean up requires (#371) (@wraithgar)
* [`b19aacb`](https://github.com/npm/pacote/commit/b19aacb925e44ccce1d99a713ad12bdf7b4a008f) [#369](https://github.com/npm/pacote/pull/369) isolate full and corgi packuments in packumentCache (#369) (@wraithgar)

## [18.0.5](https://github.com/npm/pacote/compare/v18.0.4...v18.0.5) (2024-05-06)

### Bug Fixes

* [`5e75582`](https://github.com/npm/pacote/commit/5e755820b70f60ea136d9e85eb42a6c2d9718472) [#368](https://github.com/npm/pacote/pull/368) dont set _contentLength if not in headers (#368) (@lukekarrys)
* [`1b6950b`](https://github.com/npm/pacote/commit/1b6950b993f07f87cf66a0e4d76e646939174d88) [#365](https://github.com/npm/pacote/pull/365) move bin to its own directory (@lukekarrys)
* [`1b6950b`](https://github.com/npm/pacote/commit/1b6950b993f07f87cf66a0e4d76e646939174d88) [#365](https://github.com/npm/pacote/pull/365) refactor: symbol cleanup (#365) (@lukekarrys)

## [18.0.4](https://github.com/npm/pacote/compare/v18.0.3...v18.0.4) (2024-05-04)

### Bug Fixes

* [`5fd2c80`](https://github.com/npm/pacote/commit/5fd2c80d5a0b47692fc36175bf37bded451dadac) [#363](https://github.com/npm/pacote/pull/363) linting: no-unused-vars (@lukekarrys)

### Chores

* [`d867639`](https://github.com/npm/pacote/commit/d867639ef137f924dbe1fe3d83cd230a142e703e) [#363](https://github.com/npm/pacote/pull/363) bump @npmcli/template-oss to 4.22.0 (@lukekarrys)
* [`a235f37`](https://github.com/npm/pacote/commit/a235f37a7b886c4f3e38eb3a2c34a0d240a880bb) [#363](https://github.com/npm/pacote/pull/363) postinstall for dependabot template-oss PR (@lukekarrys)

## [18.0.3](https://github.com/npm/pacote/compare/v18.0.2...v18.0.3) (2024-04-30)

### Dependencies

* [`5ecce7a`](https://github.com/npm/pacote/commit/5ecce7ac82ba9e710d3bb21ec9096a992516a2a1) [#360](https://github.com/npm/pacote/pull/360) `npm-registry-fetch@17.0.0` (#360)

## [18.0.2](https://github.com/npm/pacote/compare/v18.0.1...v18.0.2) (2024-04-24)

### Bug Fixes

* [`116b277`](https://github.com/npm/pacote/commit/116b2776822b494b5928297f4dedc01af671523a) [#358](https://github.com/npm/pacote/pull/358) don't strip underscore attributes in .manifest() (#358) (@wraithgar)

## [18.0.1](https://github.com/npm/pacote/compare/v18.0.0...v18.0.1) (2024-04-23)

### Bug Fixes

* [`b547e0d`](https://github.com/npm/pacote/commit/b547e0dfbc51c20ca13cfaba9a27f221dc38fc10) [#356](https://github.com/npm/pacote/pull/356) use @npmcli/package-json (#356) (@lukekarrys)

## [18.0.0](https://github.com/npm/pacote/compare/v17.0.7...v18.0.0) (2024-04-15)

### ⚠️ BREAKING CHANGES

* The `silent` option was used to control whether `@npmcli/run-script` would write a banner via `console.log`. Now ouput will be emitted via an `process.emit('output')`.

### Features

* [`0c04569`](https://github.com/npm/pacote/commit/0c045693dfdc8654a044b3297b49192d29a8c813) [#352](https://github.com/npm/pacote/pull/352) remove silent option (@lukekarrys)

### Dependencies

* [`cb3abc2`](https://github.com/npm/pacote/commit/cb3abc2e77326abe158e90247a12882e6a767e13) [#352](https://github.com/npm/pacote/pull/352) bump @npmcli/run-script from 7.0.4 to 8.0.0 (@dependabot[bot])

### Chores

* [`7089bb1`](https://github.com/npm/pacote/commit/7089bb108f20b2c728836651c83678d68fc181c0) [#355](https://github.com/npm/pacote/pull/355) postinstall for dependabot template-oss PR (@lukekarrys)
* [`4952672`](https://github.com/npm/pacote/commit/4952672ebca467fc1f9c49b19fb3fef9eecbaf19) [#355](https://github.com/npm/pacote/pull/355) bump @npmcli/template-oss from 4.21.3 to 4.21.4 (@dependabot[bot])

## [17.0.7](https://github.com/npm/pacote/compare/v17.0.6...v17.0.7) (2024-04-12)

### Dependencies

* [`e07c3e5`](https://github.com/npm/pacote/commit/e07c3e5bed789dabe86b1c71a2963dbce6d31567) [#350](https://github.com/npm/pacote/pull/350) `proc-log@4.0.0` (#350)

## [17.0.6](https://github.com/npm/pacote/compare/v17.0.5...v17.0.6) (2024-01-16)

### Dependencies

* [`0a5920f`](https://github.com/npm/pacote/commit/0a5920f8f8c5907b62ec0f80d11b4c3b9df24a18) [#343](https://github.com/npm/pacote/pull/343) bump sigstore from 2.0.0 to 2.2.0 (#343) (@bdehamer)

### Chores

* [`6fd23ad`](https://github.com/npm/pacote/commit/6fd23ad232035edc3624e74d4558ee18ce562bdd) [#342](https://github.com/npm/pacote/pull/342) postinstall for dependabot template-oss PR (@lukekarrys)
* [`c3b398a`](https://github.com/npm/pacote/commit/c3b398a4c646e1e202cb6f42ce846a81f4e5ddb5) [#342](https://github.com/npm/pacote/pull/342) bump @npmcli/template-oss from 4.21.1 to 4.21.3 (@dependabot[bot])
* [`4557919`](https://github.com/npm/pacote/commit/45579193a63fb7547c696ddd6bd17dd0b29ed989) [#337](https://github.com/npm/pacote/pull/337) postinstall for dependabot template-oss PR (@lukekarrys)
* [`c7e293c`](https://github.com/npm/pacote/commit/c7e293c98c9cad47e96572d5e1321b77d26c4bb9) [#337](https://github.com/npm/pacote/pull/337) bump @npmcli/template-oss from 4.19.0 to 4.21.1 (@dependabot[bot])

## [17.0.5](https://github.com/npm/pacote/compare/v17.0.4...v17.0.5) (2023-12-01)

### Bug Fixes

* [`0c96b9e`](https://github.com/npm/pacote/commit/0c96b9e825806441e043fbf97f167be3e9f5479d) [#338](https://github.com/npm/pacote/pull/338) bug to support rotated keys in signature/attestation audit (#338) (@feelepxyz)

## [17.0.4](https://github.com/npm/pacote/compare/v17.0.3...v17.0.4) (2023-08-30)

### Dependencies

* [`ba8f790`](https://github.com/npm/pacote/commit/ba8f790ca27c753921d5cef08512705b50de12e8) [#309](https://github.com/npm/pacote/pull/309) bump @npmcli/promise-spawn from 6.0.2 to 7.0.0
* [`2c0d3ae`](https://github.com/npm/pacote/commit/2c0d3ae6beaffcc849bebb1a45d6ba46cf3ce433) [#308](https://github.com/npm/pacote/pull/308) bump @npmcli/run-script from 6.0.2 to 7.0.0

## [17.0.3](https://github.com/npm/pacote/compare/v17.0.2...v17.0.3) (2023-08-24)

### Dependencies

* [`ace7c28`](https://github.com/npm/pacote/commit/ace7c283c424b12ec18c9b412515fe750538f0d9) [#305](https://github.com/npm/pacote/pull/305) bump npm-packlist from 7.0.4 to 8.0.0

## [17.0.2](https://github.com/npm/pacote/compare/v17.0.1...v17.0.2) (2023-08-18)

### Dependencies

* [`c3b892d`](https://github.com/npm/pacote/commit/c3b892db8b889e43d8f385ee1171e2e36a5b32eb) [#303](https://github.com/npm/pacote/pull/303) bump sigstore from 1.3.0 to 2.0.0

## [17.0.1](https://github.com/npm/pacote/compare/v17.0.0...v17.0.1) (2023-08-15)

### Dependencies

* [`6ddae13`](https://github.com/npm/pacote/commit/6ddae13dd4cd346255221077d13fa534ed924f63) [#302](https://github.com/npm/pacote/pull/302) bump npm-registry-fetch from 15.0.0 to 16.0.0
* [`42bf787`](https://github.com/npm/pacote/commit/42bf787be1af58050edd38ab599bb74021b88dbf) [#300](https://github.com/npm/pacote/pull/300) bump npm-pick-manifest from 8.0.2 to 9.0.0

## [17.0.0](https://github.com/npm/pacote/compare/v16.0.0...v17.0.0) (2023-08-15)

### ⚠️ BREAKING CHANGES

* support for node <=16.13 has been removed

### Bug Fixes

* [`2db2fb5`](https://github.com/npm/pacote/commit/2db2fb520b54a3a486c92f141a86c31910a5fa73) [#296](https://github.com/npm/pacote/pull/296) drop node 16.13.x support (@lukekarrys)

### Dependencies

* [`e9e964b`](https://github.com/npm/pacote/commit/e9e964b5facbf4eb1229ec17e9da3ebeaffc7fe0) [#299](https://github.com/npm/pacote/pull/299) bump read-package-json from 6.0.4 to 7.0.0
* [`5d26500`](https://github.com/npm/pacote/commit/5d26500d32bc379a26c42b7e107c9bb28dac5389) [#298](https://github.com/npm/pacote/pull/298) bump npm-package-arg from 10.1.0 to 11.0.0
* [`d13bb9c`](https://github.com/npm/pacote/commit/d13bb9c5f174f38c419bb9701efe1bd9eef27a91) [#294](https://github.com/npm/pacote/pull/294) bump @npmcli/git from 4.1.0 to 5.0.0
* [`7a25e39`](https://github.com/npm/pacote/commit/7a25e396b6ca6a54da9724726e1da4fdd5a95ea5) [#293](https://github.com/npm/pacote/pull/293) bump cacache from 17.1.4 to 18.0.0

## [16.0.0](https://github.com/npm/pacote/compare/v15.2.0...v16.0.0) (2023-07-28)

### ⚠️ BREAKING CHANGES

* the underlying fetch module now uses `@npmcli/agent`. Backwards compatibility should be fully implemented but due to the scope of this change it was made a breaking change out of an abundance of caution.
* support for node 14 has been removed

### Bug Fixes

* [`73b6297`](https://github.com/npm/pacote/commit/73b62976054951b683a5c4c5f511d39f818641e4) [#290](https://github.com/npm/pacote/pull/290) drop node14 support (#290) (@wraithgar)

### Dependencies

* [`8dc6a32`](https://github.com/npm/pacote/commit/8dc6a32a22d76028f9802fbe8920ec0911d3981a) bump minipass from 5.0.0 to 7.0.2
* [`7cebf19`](https://github.com/npm/pacote/commit/7cebf194afb45e6aa8d44150b94984c75a3a5e08) bump npm-registry-fetch from 14.0.5 to 15.0.0

## [15.2.0](https://github.com/npm/pacote/compare/v15.1.3...v15.2.0) (2023-05-03)

### Features

* [`3307ad9`](https://github.com/npm/pacote/commit/3307ad9c1600b6a60b2250c2239240ac41fc7b07) [#278](https://github.com/npm/pacote/pull/278) configurable TUF cache dir (#278) (@bdehamer)

## [15.1.3](https://github.com/npm/pacote/compare/v15.1.2...v15.1.3) (2023-04-27)

### Dependencies

* [`c99db13`](https://github.com/npm/pacote/commit/c99db13ef65d44ad94a87d3cd54c7a1d79ca07e3) [#271](https://github.com/npm/pacote/pull/271) bump minipass from 4.2.7 to 5.0.0 (#271)

## [15.1.2](https://github.com/npm/pacote/compare/v15.1.1...v15.1.2) (2023-04-20)

### Documentation

* [`43363dd`](https://github.com/npm/pacote/commit/43363dd5d3002d16297b20d3fa3c29c25b177402) [#266](https://github.com/npm/pacote/pull/266) update dist details (#266) (@wraithgar)

### Dependencies

* [`d5cb3df`](https://github.com/npm/pacote/commit/d5cb3dfbe5838aaa48bc8937681b0a9addcfae47) [#276](https://github.com/npm/pacote/pull/276) `sigstore@1.3.0` (#276)
* [`c231986`](https://github.com/npm/pacote/commit/c231986cd7a473f79add65b433e43bd7a5f9f25f) [#267](https://github.com/npm/pacote/pull/267) sigstore@^1.1.0

## [15.1.1](https://github.com/npm/pacote/compare/v15.1.0...v15.1.1) (2023-02-21)

### Bug Fixes

* [`8f4e39c`](https://github.com/npm/pacote/commit/8f4e39c72e41c8a307db2cff4e7cf9f6e630e3e2) [#261](https://github.com/npm/pacote/pull/261) always ignore ownership from tar headers (#261) (@nlf)

## [15.1.0](https://github.com/npm/pacote/compare/v15.0.8...v15.1.0) (2023-02-13)

### Features

* [`2916b72`](https://github.com/npm/pacote/commit/2916b725c3c2bdd661874ad1c54eefd10398bc46) [#259](https://github.com/npm/pacote/pull/259) verifyAttestations to registry.manifest (@feelepxyz, @bdehamer)

### Dependencies

* [`f0bd19b`](https://github.com/npm/pacote/commit/f0bd19b425be18a007538aa8cb6b55b0afc35cbe) add sigstore 1.0.0

## [15.0.8](https://github.com/npm/pacote/compare/v15.0.7...v15.0.8) (2022-12-14)

### Dependencies

* [`40aa6fe`](https://github.com/npm/pacote/commit/40aa6fe9055f3fe673fda7032c7da8958d3f574d) [#253](https://github.com/npm/pacote/pull/253) bump fs-minipass from 2.1.0 to 3.0.0

## [15.0.7](https://github.com/npm/pacote/compare/v15.0.6...v15.0.7) (2022-12-07)

### Dependencies

* [`a734d61`](https://github.com/npm/pacote/commit/a734d61379c3b5690ad2e10d382dc5486b93266b) [#250](https://github.com/npm/pacote/pull/250) bump minipass from 3.3.6 to 4.0.0

## [15.0.6](https://github.com/npm/pacote/compare/v15.0.5...v15.0.6) (2022-11-02)

### Dependencies

* [`dbbda43`](https://github.com/npm/pacote/commit/dbbda43a22fdbbc3a9c09273beaf316c0de3d4aa) [#246](https://github.com/npm/pacote/pull/246) `@npmcli/run-script@6.0.0`

## [15.0.5](https://github.com/npm/pacote/compare/v15.0.4...v15.0.5) (2022-11-01)

### Dependencies

* [`63797a8`](https://github.com/npm/pacote/commit/63797a8cb64b6979dcc9f4fd59cdf5fd5d7d65ad) [#244](https://github.com/npm/pacote/pull/244) bump @npmcli/promise-spawn from 5.0.0 to 6.0.1 (#244)

## [15.0.4](https://github.com/npm/pacote/compare/v15.0.3...v15.0.4) (2022-10-26)

### Dependencies

* [`854fad1`](https://github.com/npm/pacote/commit/854fad16afe96737abe0f6a4583aef2b962929f1) [#239](https://github.com/npm/pacote/pull/239) bump @npmcli/promise-spawn from 4.0.0 to 5.0.0 (#239)

## [15.0.3](https://github.com/npm/pacote/compare/v15.0.2...v15.0.3) (2022-10-19)

### Dependencies

* [`2a95ddb`](https://github.com/npm/pacote/commit/2a95ddbbf9f859140e3d4225a3404c16bcb6b785) [#235](https://github.com/npm/pacote/pull/235) bump @npmcli/installed-package-contents (#235)

## [15.0.2](https://github.com/npm/pacote/compare/v15.0.1...v15.0.2) (2022-10-18)

### Bug Fixes

* [`95f9cd5`](https://github.com/npm/pacote/commit/95f9cd514d9ab5b1fc0605de7fed76e6f467fbd2) handle new npm-package-arg semantics (@wraithgar)

### Dependencies

* [`2ed4d22`](https://github.com/npm/pacote/commit/2ed4d22ee7a489f05eaacae3ce30619ef455de71) `npm-package-arg@10.0.0`

## [15.0.1](https://github.com/npm/pacote/compare/v15.0.0...v15.0.1) (2022-10-17)

### Dependencies

* [`74821c2`](https://github.com/npm/pacote/commit/74821c26a19e025c5eeb24a6dacb20bc9cb7dfcc) [#229](https://github.com/npm/pacote/pull/229) bump @npmcli/run-script from 4.2.1 to 5.0.0 (#229)
* [`a9844d0`](https://github.com/npm/pacote/commit/a9844d047c4c8633e9caab25e69143b737880fe4) [#226](https://github.com/npm/pacote/pull/226) bump @npmcli/promise-spawn from 3.0.0 to 4.0.0 (#226)
* [`1058177`](https://github.com/npm/pacote/commit/1058177e43cd9b8af8cdb097b8efe403b45a70d3) [#227](https://github.com/npm/pacote/pull/227) bump read-package-json from 5.0.2 to 6.0.0
* [`0f5ef8a`](https://github.com/npm/pacote/commit/0f5ef8afb359bf461c2b3a6b0fb6cb983a58a83f) [#228](https://github.com/npm/pacote/pull/228) bump @npmcli/installed-package-contents from 1.0.7 to 2.0.0
* [`7e3b4b5`](https://github.com/npm/pacote/commit/7e3b4b5e4cb48a5304ac850d9cc66c9aee046b41) [#220](https://github.com/npm/pacote/pull/220) bump ssri from 9.0.1 to 10.0.0
* [`4e7536d`](https://github.com/npm/pacote/commit/4e7536d3dc3c2cd5db2defbe5b5d0e2e2e686dfd) [#222](https://github.com/npm/pacote/pull/222) bump @npmcli/git from 3.0.2 to 4.0.0
* [`3bc7550`](https://github.com/npm/pacote/commit/3bc75501972833f707ffac4219ef57ed43e51e77) [#223](https://github.com/npm/pacote/pull/223) bump npm-pick-manifest from 7.0.2 to 8.0.0
* [`41fab27`](https://github.com/npm/pacote/commit/41fab27f1d42d78fc2e46e271461c5a066cb170d) [#224](https://github.com/npm/pacote/pull/224) bump proc-log from 2.0.1 to 3.0.0
* [`4abf24a`](https://github.com/npm/pacote/commit/4abf24ac8bdf698a9fcbf085e629d6f4e0981f1e) [#218](https://github.com/npm/pacote/pull/218) bump npm-registry-fetch from 13.3.1 to 14.0.0 (#218)

## [15.0.0](https://github.com/npm/pacote/compare/v14.0.0...v15.0.0) (2022-10-13)

### ⚠️ BREAKING CHANGES

* this package no longer attempts to change file ownership automatically

### Features

* [`43ae022`](https://github.com/npm/pacote/commit/43ae02203f04fd597a6d73f0a8bb4e639986e62e) [#216](https://github.com/npm/pacote/pull/216) do not alter file ownership (#216) (@nlf)

### Dependencies

* [`2ac3980`](https://github.com/npm/pacote/commit/2ac39808b135987eb9e1f0200212c64cbf77973c) [#213](https://github.com/npm/pacote/pull/213) bump read-package-json-fast from 2.0.3 to 3.0.0

## [14.0.0](https://github.com/npm/pacote/compare/v14.0.0-pre.3...v14.0.0) (2022-10-05)

### Features

* [`ee16f1f`](https://github.com/npm/pacote/commit/ee16f1f44a8a3510b8ac8c49f207d3e01d1db96e) [#207](https://github.com/npm/pacote/pull/207) set as release (@fritzy)

## [14.0.0-pre.3](https://github.com/npm/pacote/compare/v14.0.0-pre.2...v14.0.0-pre.3) (2022-09-28)

### ⚠️ BREAKING CHANGES

* a `@npmcli/arborist` constructor must be passed in if no tree is provided and pacote is going to operate on git dependencies.

### Features

* [`d6ef5dc`](https://github.com/npm/pacote/commit/d6ef5dc8856cfc81de15d1b2fb0c647cecca2496) [#204](https://github.com/npm/pacote/pull/204) require arborist constructor to be passed in for preparing git dirs (#204) (@lukekarrys)

## [14.0.0-pre.2](https://github.com/npm/pacote/compare/v14.0.0-pre.1...v14.0.0-pre.2) (2022-09-27)

### ⚠️ BREAKING CHANGES

* `pacote` now has a peer dependency on `@npmcli/arborist`.

### Features

* [`d3517fd`](https://github.com/npm/pacote/commit/d3517fd4a0e21bbc2e9d729cd88666a829de59fc) [#202](https://github.com/npm/pacote/pull/202) pacote now optionally takes a tree when preparing directories (@lukekarrys)

## [14.0.0-pre.1](https://github.com/npm/pacote/compare/v14.0.0-pre.0...v14.0.0-pre.1) (2022-09-22)

### ⚠️ BREAKING CHANGES

* the `_cached` attribute has been removed from packuments.

### Bug Fixes

* [`8ca3751`](https://github.com/npm/pacote/commit/8ca3751edf7be9f27227f4a205676401303871db) [#175](https://github.com/npm/pacote/pull/175) packument: eliminate _cached field (#175) (@jablko)

## [14.0.0-pre.0](https://github.com/npm/pacote/compare/v13.6.2...v14.0.0-pre.0) (2022-09-21)

### ⚠️ BREAKING CHANGES

* npm-packlist@6.0.0
* `pacote` is now compatible with the following semver range for node: `^14.17.0 || ^16.13.0 || >=18.0.0`

### Features

* [`72e9be4`](https://github.com/npm/pacote/commit/72e9be4e3d6615f64654c7cb37bfffb673f84ba5) [#197](https://github.com/npm/pacote/pull/197) postinstall for dependabot template-oss PR (@lukekarrys)

### Dependencies

* [`1216ec6`](https://github.com/npm/pacote/commit/1216ec6e694c4fc05b6d8da0dc2042baa0822087) [#200](https://github.com/npm/pacote/pull/200) `npm-packlist@6.0.0`

## [13.6.2](https://github.com/npm/pacote/compare/v13.6.1...v13.6.2) (2022-08-16)


### Bug Fixes

* linting ([#187](https://github.com/npm/pacote/issues/187)) ([cf1c5ed](https://github.com/npm/pacote/commit/cf1c5ed47810d98568cfdbd2c4b06b51e6fccd32))

## [13.6.1](https://github.com/npm/pacote/compare/v13.6.0...v13.6.1) (2022-06-21)


### Dependencies

* bump @npmcli/run-script from 3.0.3 to 4.1.0 ([#185](https://github.com/npm/pacote/issues/185)) ([d0459ec](https://github.com/npm/pacote/commit/d0459ec46d85466c71aa7a9594fbb84ec6d18277))

## [13.6.0](https://github.com/npm/pacote/compare/v13.5.0...v13.6.0) (2022-06-01)


### Features

* allow reuse of external integrity stream ([fdb9e5a](https://github.com/npm/pacote/commit/fdb9e5a8b659786f002e7901cf011242d57139db))
* replaceRegistryHost can now be a hostname ([#177](https://github.com/npm/pacote/issues/177)) ([a9a4cdd](https://github.com/npm/pacote/commit/a9a4cdd79a46b002ceba4d7944d0524367ed599c))


### Bug Fixes

* error when passing signature without keys ([#176](https://github.com/npm/pacote/issues/176)) ([d69e524](https://github.com/npm/pacote/commit/d69e524845ce5a752bdba9a2e3647ce23934b3a9))


### Documentation

* add some fields to the README ([#180](https://github.com/npm/pacote/issues/180)) ([f356cb2](https://github.com/npm/pacote/commit/f356cb2ebef239131fc24a9d23ca3cc595a254d4))

## [13.5.0](https://github.com/npm/pacote/compare/v13.4.1...v13.5.0) (2022-05-25)


### Features

* bump npm-packlist for workspace awareness ([#178](https://github.com/npm/pacote/issues/178)) ([316059b](https://github.com/npm/pacote/commit/316059b07c837d60fc90d3edb60ffc8717e7ca65))

### [13.4.1](https://github.com/npm/pacote/compare/v13.4.0...v13.4.1) (2022-05-19)


### Bug Fixes

* pass prefix and workspaces to npm-packlist ([#173](https://github.com/npm/pacote/issues/173)) ([6de3a2b](https://github.com/npm/pacote/commit/6de3a2b4bbe1444d8e116637cb086ae559fe02ee))

## [13.4.0](https://github.com/npm/pacote/compare/v13.3.0...v13.4.0) (2022-05-17)


### Features

* add verifySignatures to registry.manifest ([#170](https://github.com/npm/pacote/issues/170)) ([4401c58](https://github.com/npm/pacote/commit/4401c58633023c54c7605443a0399cbde01c7b70))

## [13.3.0](https://github.com/npm/pacote/compare/v13.2.0...v13.3.0) (2022-05-04)


### Features

* add _signatures to manifest ([3ae73f2](https://github.com/npm/pacote/commit/3ae73f22cc875f3e6d1a61ad887ed5a3fc74343f))

## [13.2.0](https://github.com/npm/pacote/compare/v13.1.1...v13.2.0) (2022-05-02)


### Features

* add always option to replaceRegistryHost ([#164](https://github.com/npm/pacote/issues/164)) ([edd1ee5](https://github.com/npm/pacote/commit/edd1ee53915c14bdeed8b3dcbf066be82b26a9ff))

### [13.1.1](https://github.com/npm/pacote/compare/v13.1.0...v13.1.1) (2022-04-06)


### Dependencies

* bump npm-packlist from 4.0.0 to 5.0.0 ([#159](https://github.com/npm/pacote/issues/159)) ([d7f07d6](https://github.com/npm/pacote/commit/d7f07d6dcbdd148c614f3dc52181af7d6203c40a))

## [13.1.0](https://github.com/npm/pacote/compare/v13.0.6...v13.1.0) (2022-04-05)


### Features

* add option to not replace magic registry host ([#143](https://github.com/npm/pacote/issues/143)) ([f519cf4](https://github.com/npm/pacote/commit/f519cf42fc4f033398701fa7f9f8db8f1c08c53d))

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
