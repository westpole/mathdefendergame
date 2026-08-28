
## [1.0.0](https://github.com/westpole/mathdefendergame/compare/v0.1.1...v1.0.0) (2026-08-28)

### Features

* [#1](https://github.com/westpole/mathdefendergame/issues/1) setup e2e tests configuration ([651724a](https://github.com/westpole/mathdefendergame/commit/651724a303d0f6d195f9289608d1b96aaa8b3fce))
* [#10](https://github.com/westpole/mathdefendergame/issues/10) implement login functionality with profile management and validation ([9a502e3](https://github.com/westpole/mathdefendergame/commit/9a502e3c430a8d3b4baeb0972073bd4c51624b32))
* [#13](https://github.com/westpole/mathdefendergame/issues/13) add game history tracking and operations telemetry; update game store and tests ([26c44af](https://github.com/westpole/mathdefendergame/commit/26c44af8c6850ee8f11bd224995fcd65aee6ee6b))
* [#13](https://github.com/westpole/mathdefendergame/issues/13) implement profile view and navigation; update menu and related components ([64daccf](https://github.com/westpole/mathdefendergame/commit/64daccf68e87a52f3efef8fbff0e712bb4f921e9))
* [#14](https://github.com/westpole/mathdefendergame/issues/14) add PerformanceOverlay component and integrate performance view in menu navigation ([65e7761](https://github.com/westpole/mathdefendergame/commit/65e77613a146ad4ed47ce05fa62a66b1fbbab699))
* [#14](https://github.com/westpole/mathdefendergame/issues/14) add type definition for GameHistoryEntry in gameStore tests ([2cf7682](https://github.com/westpole/mathdefendergame/commit/2cf7682d165475bdbbfc1a1dbd77acfbcec9f285))
* [#14](https://github.com/westpole/mathdefendergame/issues/14) implement close confirmation logic in Electron main process and UI ([9f1746c](https://github.com/westpole/mathdefendergame/commit/9f1746c511f262d47da95a821a506999d13cd1b9))
* [#14](https://github.com/westpole/mathdefendergame/issues/14) implement game start and saving confirmation logic in E2E tests ([92cc4ed](https://github.com/westpole/mathdefendergame/commit/92cc4ed54f2aab77584cc65aa63f4f9f7479d875))
* [#14](https://github.com/westpole/mathdefendergame/issues/14) implement lifetime score tracking and update grade resolution logic ([a9a6349](https://github.com/westpole/mathdefendergame/commit/a9a6349059350bd9c27207a9895f48cf06dd50af))
* [#14](https://github.com/westpole/mathdefendergame/issues/14) update game history management to retain full history per profile ([3fef66c](https://github.com/westpole/mathdefendergame/commit/3fef66cc63020337b26552e49ef27ede3d0525f0))
* [#14](https://github.com/westpole/mathdefendergame/issues/14) update ProfileOverlay to display average answers per minute ([0bcf3f5](https://github.com/westpole/mathdefendergame/commit/0bcf3f5812e124b86e1c7dc9a6ec6ebfc5490dce))
* [#15](https://github.com/westpole/mathdefendergame/issues/15) implement login functionality with profile management and start menu controls ([d137d74](https://github.com/westpole/mathdefendergame/commit/d137d74b12d7b5364481a2e247905086dea77716))
* [#16](https://github.com/westpole/mathdefendergame/issues/16) add new grade icons and update game logic for scoring and lives; refactor HUD and menu components ([e1f6e5a](https://github.com/westpole/mathdefendergame/commit/e1f6e5abdb503bb3af606654fc29529fb7a73e76))
* [#21](https://github.com/westpole/mathdefendergame/issues/21) update game logic for grade progression and enhance GameOverOverlay; refactor related components and tests ([9417863](https://github.com/westpole/mathdefendergame/commit/9417863177909133e6956b6306f8cb7b43182f3d))
* [#22](https://github.com/westpole/mathdefendergame/issues/22) add gradeIcons module and update image source logic in MainMenuOverlay and ProfileOverlay ([693a6ad](https://github.com/westpole/mathdefendergame/commit/693a6ad7cf1e09cdc670c49c4f287db47895024d))
* [#22](https://github.com/westpole/mathdefendergame/issues/22) add radar screen background to HUD center panel ([f526e2c](https://github.com/westpole/mathdefendergame/commit/f526e2c7408d244ad53a6d1c9f462eeb94640107))
* [#22](https://github.com/westpole/mathdefendergame/issues/22) implement streak reward system and update HUD to display streak status ([5e4e7d2](https://github.com/westpole/mathdefendergame/commit/5e4e7d22c47282408dc8a53d721870472b2a114c))
* [#22](https://github.com/westpole/mathdefendergame/issues/22) implement window close confirmation dialog and pause overlay functionality ([c5b5796](https://github.com/westpole/mathdefendergame/commit/c5b5796f9147e3694995b5cb2a94eb7d34c6d1bc))
* [#22](https://github.com/westpole/mathdefendergame/issues/22) update HUDOverlay and styles for improved shield status display ([b33ac53](https://github.com/westpole/mathdefendergame/commit/b33ac5398fd17fe62655e44a41ae0f8326a1ebc6))
* [#24](https://github.com/westpole/mathdefendergame/issues/24) add Enter key functionality to continue game in StageMessageOverlay ([3efb7f4](https://github.com/westpole/mathdefendergame/commit/3efb7f4993361755c5eb29d01821c091e1c3c600))
* [#24](https://github.com/westpole/mathdefendergame/issues/24) update HUDOverlay stories and mocks for shield and life states ([822c359](https://github.com/westpole/mathdefendergame/commit/822c359502bd55397ce3a0f0cfcde3dd1755c3e2))
* [#24](https://github.com/westpole/mathdefendergame/issues/24) update HUDOverlay tests to include danger range warning for lives ([03f2a93](https://github.com/westpole/mathdefendergame/commit/03f2a9372ab1cdcc2f145b0212598120116b5735))
* [#26](https://github.com/westpole/mathdefendergame/issues/26) add agent documentation for dependency audit, Electron shell, gameplay rules, Phaser scene, quality gates, React-Zustand UI, shared fixtures, Storybook stories, and test authoring ([7497c1c](https://github.com/westpole/mathdefendergame/commit/7497c1c7a55e1f9b32d66305ba07cb42b9b4a6e8))
* [#26](https://github.com/westpole/mathdefendergame/issues/26) add PauseOverlay component with mock states and update related stories ([8e1d935](https://github.com/westpole/mathdefendergame/commit/8e1d935205bded222ef81d5db36c5a6b26c555f3))
* [#26](https://github.com/westpole/mathdefendergame/issues/26) refactor tests to use mock store state for LoginOverlay, ProfileOverlay, and App components ([6aa5422](https://github.com/westpole/mathdefendergame/commit/6aa5422b895733469af6b528409c5c77400859ed))
* [#29](https://github.com/westpole/mathdefendergame/issues/29) add release agent for production workflows and version management ([5fe1625](https://github.com/westpole/mathdefendergame/commit/5fe1625e1882a9be90b812e6f3aa192658d75e59))
* include ISC license ([e132088](https://github.com/westpole/mathdefendergame/commit/e132088ff7850afea8a5504627e65db21d34c28b))
* introduce Eslint ([cb21e5c](https://github.com/westpole/mathdefendergame/commit/cb21e5c742f602c01a2e1320e31d85aff983a8c2))
* introduce SASS to project ([65e8bea](https://github.com/westpole/mathdefendergame/commit/65e8bea42b690f8ccc70978a84d24a85d0f1f9b8))
* setup vitest with coverage ([d8dc570](https://github.com/westpole/mathdefendergame/commit/d8dc5703601936062ca567518857273a3be82fd3))
* update React skill and agent reviewer to deal with SASS ([b796fc6](https://github.com/westpole/mathdefendergame/commit/b796fc662461669d555eabeecfeabe9646446e7a))
* update UI and include city view on the bottom ([e15af0b](https://github.com/westpole/mathdefendergame/commit/e15af0b51608048f06228562d05bfe8d7502f1c5))

### Bug Fixes

* [#21](https://github.com/westpole/mathdefendergame/issues/21) update grade icon border radius for improved styling ([71dcad2](https://github.com/westpole/mathdefendergame/commit/71dcad2bd81d152e7b6147d15a39d65be2d4357b))
* [#22](https://github.com/westpole/mathdefendergame/issues/22) update stage value in HUDOverlay tests and improve status square assertions ([d06b964](https://github.com/westpole/mathdefendergame/commit/d06b96401dec54dc7ad929ca2165b73ac8e0b87c))
* [#29](https://github.com/westpole/mathdefendergame/issues/29) update streak handling in checkAnswer logic ([0d51a40](https://github.com/westpole/mathdefendergame/commit/0d51a4087b3a61d0baca605be687f7aa0f2e0cfa))
* correct changelog script and content file ([8ae8853](https://github.com/westpole/mathdefendergame/commit/8ae8853683243b45234bc78f993261f37f149395))
* correct output folder for Vitest UI ([92ce087](https://github.com/westpole/mathdefendergame/commit/92ce087ffc43887b98ca0ca8041bc8a31a6f6fb2))
* correct Reports directory ([8280e72](https://github.com/westpole/mathdefendergame/commit/8280e72a7d1bcbab46da067e22e4c1a8e1d908fd))
* correct storybook config ([1ed4801](https://github.com/westpole/mathdefendergame/commit/1ed48019036e9f68067392ad26befa9bd5b35b14))
* remove meteorites on stage finish ([b3eb227](https://github.com/westpole/mathdefendergame/commit/b3eb227bb4f0b7ea08c3f335ba7f0c29fc166235))
* resolve issue with missing Webapp in the final Prod build ([cdf8d33](https://github.com/westpole/mathdefendergame/commit/cdf8d3325551bb4d1e8fbe24d8e670486d438377))
* revisit Electron setup to be able to run tests ([4355845](https://github.com/westpole/mathdefendergame/commit/4355845c11952630f4970bad2642a44a7bdc6574))

### Reverts

* [#12](https://github.com/westpole/mathdefendergame/issues/12) restore removed playwright setup for StoryBook test runner ([36a4bf0](https://github.com/westpole/mathdefendergame/commit/36a4bf0fc3bddc46ff64b8f5e9bfdbb40237f8b4))

## [0.1.1](https://github.com/westpole/mathdefendergame/compare/v0.1.0...v0.1.1) (2026-07-13)

### Bug Fixes

* update git push command to use master branch ([75e983d](https://github.com/westpole/mathdefendergame/commit/75e983dad8e89a5dc9d6c09e40531f9a723a31d2))

## [0.1.0](https://github.com/westpole/mathdefendergame/compare/58eb709e361bad482f6237fdf03ead62f04fbbfb...v0.1.0) (2026-07-13)

### Features

* add changelog generation and release scripts to package.json ([239b071](https://github.com/westpole/mathdefendergame/commit/239b0712250e88d42f4f2dba15f43e4666db6039))
* add Loading component Storybook stories ([aa89f99](https://github.com/westpole/mathdefendergame/commit/aa89f996fe437dfc376086bbbe58d9be04cf5dc2))
* add mock data for game start and in-progress scenarios in HUDOverlay stories ([19e81ec](https://github.com/westpole/mathdefendergame/commit/19e81ec7dca1f34814ccf5fe9e2db3bec39843eb))
* add process documentation and project findings for development workflow and architecture alignment ([f109686](https://github.com/westpole/mathdefendergame/commit/f109686af86ca21f8e0e2bde43a6bab8a129192d))
* add project architecture guidelines for Phaser, React, and Zustand ([49ac978](https://github.com/westpole/mathdefendergame/commit/49ac9786cc57e601fc8b8846015ede165b4b07a1))
* add React and Zustand dependencies, update TypeScript config for JSX support, and configure Vite with React plugin ([5e113b3](https://github.com/westpole/mathdefendergame/commit/5e113b367029324c8f4f9497adf2ad82a12a3295))
* add reusable canvas size, redesign HUD, improve storybook stories ([d7cdb5b](https://github.com/westpole/mathdefendergame/commit/d7cdb5b6f629f3a6955aa16798ed20ebe6cd6a98))
* add Storybook integration and Vitest support ([5a6776a](https://github.com/westpole/mathdefendergame/commit/5a6776ade398636116f329f37213aac04f9ec851))
* create initial setup for Application ([58eb709](https://github.com/westpole/mathdefendergame/commit/58eb709e361bad482f6237fdf03ead62f04fbbfb))
* enhance rendering configuration for improved visual quality ([3f907c0](https://github.com/westpole/mathdefendergame/commit/3f907c0eb54825aa2ab8997990bfeaaa0fb1338a))
* implement game structure with React and Zustand, integrating Phaser for gameplay and UI overlays ([cdac417](https://github.com/westpole/mathdefendergame/commit/cdac417bcea32b683a7ebc3652aaefb88577f582))
* include different stories for GameOverLayout component ([207619d](https://github.com/westpole/mathdefendergame/commit/207619d92e2403b6e864c00b56c2ce8e8eedff3b))
* include StoryBook configuration manual ([93717f6](https://github.com/westpole/mathdefendergame/commit/93717f6d1bc5c9d7bc74c673726143e00bf537f6))
* introduce Agent skills instructions ([eb060c7](https://github.com/westpole/mathdefendergame/commit/eb060c7512806a461627b055e717ada25a02d0fe))
* introduce stories for Leaderboard component ([0574b9d](https://github.com/westpole/mathdefendergame/commit/0574b9df9497806edf28a33e8d18e8942f4863d3))
* refactor game structure by removing unused scenes and updating input handling in GameScene ([e2d20d7](https://github.com/westpole/mathdefendergame/commit/e2d20d7fc310302355f076f561617cf9065c123d))
* replace cookieManager with store for data ([14bf1bd](https://github.com/westpole/mathdefendergame/commit/14bf1bdcd5ae274cc3e6d53b6fcff2e682347caf))
* split original HTML into project setup structure ([ef206a9](https://github.com/westpole/mathdefendergame/commit/ef206a93e951cb6e8f6174d3c5612ecd57de36b2))
* **storybook:** move example to the Docs folder ([0ce1c70](https://github.com/westpole/mathdefendergame/commit/0ce1c70090dc9983e666bb15b28855f06b120b71))
* update instructions to include skills ([e1e7e9d](https://github.com/westpole/mathdefendergame/commit/e1e7e9ddb8639ab95756b449bb61f92ebba6ba68))
* update process documentation with StoryBook and repository preparation details ([3d4f547](https://github.com/westpole/mathdefendergame/commit/3d4f54745001ff81d55e008dc7d960f89c1d6f4c))

### Bug Fixes

* create scope for styles files ([208afa3](https://github.com/westpole/mathdefendergame/commit/208afa35e9cfbd3dda3fc9a5d29ae7b23f51f6cd))
