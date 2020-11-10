# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.5.0](https://github.com/carvjs/tools/compare/@carv/scripts@1.4.6...@carv/scripts@1.5.0) (2020-11-10)

### Bug Fixes

- only load @testing-library/jest-dom if it is installed ([a1f0c01](https://github.com/carvjs/tools/commit/a1f0c01313621855cbb64e4b7193c5e13155fd90))

### Features

- speed up incremental rebuild by bundling all node_modules as web_modules ([7c83279](https://github.com/carvjs/tools/commit/7c83279e95c9d47143d3f9ea46f1766f6f3bc6ff))

## [1.4.6](https://github.com/carvjs/tools/compare/@carv/scripts@1.4.5...@carv/scripts@1.4.6) (2020-11-05)

### Bug Fixes

- **watch:** ensure stable module names ([f711ea7](https://github.com/carvjs/tools/commit/f711ea73aba7bdff139480952f5184c7b1389957))

## [1.4.5](https://github.com/carvjs/tools/compare/@carv/scripts@1.4.4...@carv/scripts@1.4.5) (2020-11-05)

### Bug Fixes

- **rollup:** resolve loop ([e72c766](https://github.com/carvjs/tools/commit/e72c76616c91e8830cd5a4eb10b379d072aae1c9))

## [1.4.4](https://github.com/carvjs/tools/compare/@carv/scripts@1.4.3...@carv/scripts@1.4.4) (2020-10-30)

### Bug Fixes

- **rollup:** dynamic import vars not within node_modules ([f3cb1fe](https://github.com/carvjs/tools/commit/f3cb1fea2df635e915a5081cf0917c65a77550a9))

## [1.4.3](https://github.com/carvjs/tools/compare/@carv/scripts@1.4.2...@carv/scripts@1.4.3) (2020-10-30)

**Note:** Version bump only for package @carv/scripts

## [1.4.2](https://github.com/carvjs/tools/compare/@carv/scripts@1.4.1...@carv/scripts@1.4.2) (2020-10-28)

### Bug Fixes

- disable treeshake in watch mode ([a60b330](https://github.com/carvjs/tools/commit/a60b3303ba9fc5dcfae97026d73bbcd7a0f80a82))
- do not fail on missing gitignore ([f873d8c](https://github.com/carvjs/tools/commit/f873d8c14f4e6a9bff660d9f0620a2fc199c200f))
- use new rollup-plugin-hot ([a6a1220](https://github.com/carvjs/tools/commit/a6a122029db96af76aac7f1ea37634cc7d030cd6))

## [1.4.1](https://github.com/carvjs/tools/compare/@carv/scripts@1.4.0...@carv/scripts@1.4.1) (2020-10-09)

**Note:** Version bump only for package @carv/scripts

# [1.4.0](https://github.com/carvjs/tools/compare/@carv/scripts@1.3.0...@carv/scripts@1.4.0) (2020-10-06)

### Features

- **jest:** add fetch to dom enviroment ([5992207](https://github.com/carvjs/tools/commit/5992207776fd17cfe73a2d52a3240ebb2c219381))

# [1.3.0](https://github.com/carvjs/tools/compare/@carv/scripts@1.2.5...@carv/scripts@1.3.0) (2020-10-06)

### Features

- **jest:** support crypto in jsdom enviroment ([4f9ba20](https://github.com/carvjs/tools/commit/4f9ba2028011dcd6a55c4653339cc6fd076f6c3b))

## [1.2.5](https://github.com/carvjs/tools/compare/@carv/scripts@1.2.4...@carv/scripts@1.2.5) (2020-09-25)

### Bug Fixes

- svelte 2 tsx ([8cf8bee](https://github.com/carvjs/tools/commit/8cf8bee78b2bcae1c3a830ed9d05e3d3a6bf0a15))

## [1.2.4](https://github.com/carvjs/tools/compare/@carv/scripts@1.2.3...@carv/scripts@1.2.4) (2020-09-22)

### Bug Fixes

- json loading ([01fc52f](https://github.com/carvjs/tools/commit/01fc52faf1cac4f61e6d61302fc0d449f4ac4e42))

## [1.2.3](https://github.com/carvjs/tools/compare/@carv/scripts@1.2.2...@carv/scripts@1.2.3) (2020-09-22)

### Bug Fixes

- use published rollup-plugin-hot ([0a834f5](https://github.com/carvjs/tools/commit/0a834f52277427ee9d55eccd7cf7bff5eda36b32))

## [1.2.2](https://github.com/carvjs/tools/compare/@carv/scripts@1.2.1...@carv/scripts@1.2.2) (2020-09-21)

### Bug Fixes

- css modules ([ee652f4](https://github.com/carvjs/tools/commit/ee652f499cb56cba34d62c53d41b8701c3c906a6))
- css sourcemap ([81d33a8](https://github.com/carvjs/tools/commit/81d33a82bf6c0b077362d04d9c6858295bf68fd0))

## [1.2.1](https://github.com/carvjs/tools/compare/@carv/scripts@1.2.0...@carv/scripts@1.2.1) (2020-09-17)

### Bug Fixes

- svelte-check ignore all node_modules and docs folders ([779d057](https://github.com/carvjs/tools/commit/779d057cbf90ff8ec1fa43a6642619d8319f53d4))

# [1.2.0](https://github.com/carvjs/tools/compare/@carv/scripts@1.1.1...@carv/scripts@1.2.0) (2020-09-17)

### Bug Fixes

- better svelte to tsx transform ([0bf4168](https://github.com/carvjs/tools/commit/0bf416817f6f600ecfb95a8ec4f28932d24ccd4d))
- no svelte import in types and mark all modules as side effect free ([99e8fa6](https://github.com/carvjs/tools/commit/99e8fa62804c2af79cc6f4c54fc15bf2fc4e5fa5))
- svelte jsx types only for build ([9b96d1e](https://github.com/carvjs/tools/commit/9b96d1e04898fb797b8c5468ae3c6f5d96ab0efe))

### Features

- css modules and asset type definitions ([36f0b5a](https://github.com/carvjs/tools/commit/36f0b5a923663191a51e14015e751a2080a6c18c))
- keep css module classNames and esbuild fixes ([21df754](https://github.com/carvjs/tools/commit/21df754cb5aee0d8159e0e4bba5b0a8ae9a07eda))
- typescript declarations for svelte components ([4fcdd1d](https://github.com/carvjs/tools/commit/4fcdd1d43a607c8f4d092d312a030430555ca681))

## [1.1.1](https://github.com/carvjs/tools/compare/@carv/scripts@1.1.0...@carv/scripts@1.1.1) (2020-09-04)

**Note:** Version bump only for package @carv/scripts

# 1.1.0 (2020-09-04)

### Bug Fixes

- **nps:** default to npm lifecycle event ([3ab32ad](https://github.com/carvjs/tools/commit/3ab32aded9fb40b52648db02b32dd3512faeadeb))
- jest esbuild ([950e21c](https://github.com/carvjs/tools/commit/950e21c7826c46632c22ee094edd21faa66d0b3f))
- needs at least node 14.8 ([938cf73](https://github.com/carvjs/tools/commit/938cf73312f155ccc0196ec482923d98fe9d7d94))
- only hide import.meta if needed ([57576f2](https://github.com/carvjs/tools/commit/57576f29a03a100cd9023121bb54179ca01bbe04))

### Features

- **rollup:** size summary ([ef3ecc6](https://github.com/carvjs/tools/commit/ef3ecc63749890768f312d6a8f535245b7e0ba3b))
- alias and jestOptions ([dbdd592](https://github.com/carvjs/tools/commit/dbdd592a5e4cee948bc9381992ddb777cae5c550))
- alias resolving ([dc848f9](https://github.com/carvjs/tools/commit/dc848f989ddf75f10a04b6004fece3261eb4bbbe))
- build info ([12e8e86](https://github.com/carvjs/tools/commit/12e8e86362217b23556c75d3f0eb4aef97ac39ad))
- css modules ([09ddb91](https://github.com/carvjs/tools/commit/09ddb91928df72a29a45bd0b864d0d88d8a46d38))
- dynamic import variables ([510d521](https://github.com/carvjs/tools/commit/510d52195c6200e20b29139d8b8d1b27d968f89a))
- hmr server ([c512043](https://github.com/carvjs/tools/commit/c51204340d7e411e6d31089dc255b4f24670f6dc))
- local path alias ([861653e](https://github.com/carvjs/tools/commit/861653e144a01b62deea4c7ab4d5b62e481fcbff))
- sass and app bundle ([ded5c41](https://github.com/carvjs/tools/commit/ded5c41caca719474927070f1f5c4b1e9048affc))
- transform files and graphql ([3300e3b](https://github.com/carvjs/tools/commit/3300e3bb5c27090e062c2665e5750cd68c81957a))
- use v8 cache to speed up instantiation time ([e271d57](https://github.com/carvjs/tools/commit/e271d570d91e2a31d5aaae295839dc6b5165730e))

# Change Log
