# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Changelog!

## [0.5.0] - 2018-08-26
### Added
- Statistics to map view (area, duration, distance, collisions).
- Main menu translations.
- Generic toolbar styles.
- Map toolbar with view flipping options.

### Changed
- Map renderer (improved log display, code cleanup, fixes, improved rendering).
- Map wall rendering to look less confusing.
- Height of map canvas element.

### Fixed
- Statistics page update behaviour.
- JS error while reading cleaning logs with blank lines.
- Inaccurate map bound coordinates.
- Update map viewer to latest features (new renderer, toolbar, bugfixes).
- Occasional layout issue with form labels.

## [0.4.0] - 2017-04-22
### Added
- Full support for screen readers (and accessibility basics).

### Fixed
- Missing pause action when homing.

## [0.3.0] - 2016-12-04
### Added
- Favicons and browser manifests.
- SASS!
- Software update/file upload feature to service tab.
- Hombot xml file editing to service tab.
- Hombot properties to service tab.

### Changed
- Project configuration to netbeans 8.2.

### Fixed
- Navigation shadow appearing on desktop view.
- Loading spinner position.
- Special characters breaking email form submission.
- Layout issues with file input.

## [0.2.0] - 2016-11-05
### Added
- Camera-view (aka Pedropatch) integration.
- Joystick to drive around manually.
- Start-/pause-/homing-button.
- Big performance improvements!
- Uglifying for distribution js assets.
- Automatic module loading in build process.
- Link to legacy service page and downloads.

### Changed
- Reduce requests on libs by combining all interface libs into one ui lib.
- Extension of language files (js -> json).

### Fixed
- Wrong copy command in installer.
- Event handlers for mobile and desktop.

## [0.1.0] - 2016-11-01
### Added
- Webinterface with status, map, schedule, statistics, service and mail views
- Map viewer to view cleaning records offline in a browser

[Unreleased]: https://github.com/rampage128/hombot-interface/compare/0.5.0...HEAD
[0.5.0]: https://github.com/rampage128/hombot-interface/compare/0.4.0...0.5.0
[0.4.0]: https://github.com/rampage128/hombot-interface/compare/0.3.0...0.4.0
[0.3.0]: https://github.com/rampage128/hombot-interface/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/rampage128/hombot-interface/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/rampage128/hombot-interface/tree/0.1.0