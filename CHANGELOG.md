# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.2 - 2022-09-21

### Fixed

- getPaths now properly escapes path strings with dashes
- getPaths now returns results for schema properties with multiple types

## [0.4.1] - 2021-10-28

### Fixed

- Fixed a race condition that would cause a crash if schema was undefined

## [0.4.0] - 2021-05-12

### Fixed

- React added as a peerDependency to prevent invalid hook call errors

## [0.3.10] - 2020-12-08

### Updated

- defaultIsValidBasicExpression changed to allow more complex jsonata strings

## [0.3.8] - 2020-03-11

### Added

- Math support added to text fields

[unreleased]: https://github.com/jsonata-ui/jsonata-visual-editor/compare/jsonata-visual-editor@0.4.2...HEAD
[0.4.2]: https://github.com/jsonata-ui/jsonata-visual-editor/releases/tag/jsonata-visual-editor@0.4.2
[0.4.1]: https://github.com/jsonata-ui/jsonata-visual-editor/releases/tag/jsonata-visual-editor@0.4.1
[0.4.0]: https://github.com/jsonata-ui/jsonata-visual-editor/releases/tag/jsonata-visual-editor@0.4.0
[0.3.10]: https://github.com/jsonata-ui/jsonata-visual-editor/releases/tag/jsonata-visual-editor@0.3.10
[0.3.8]: https://github.com/jsonata-ui/jsonata-visual-editor/releases/tag/jsonata-visual-editor@0.3.8
