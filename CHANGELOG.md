# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add ability to share incomplete game

### Changed

- CLI: How to Play text adjusted to resemble browser version
- CLI: "Copied to clipboard" text now appears before Next Wordle time

### Fixed

- CLI: Fix default share option of yes not copying to clipboard

## [1.2.7] - 2024-05-31

### Added

- Browser: Add settings knob element, in place of ON/OFF toggle text for hard mode and high contrast settings
- CLI: Now installable from npm
- CLI: Add high contrast mode
- CLI: Add `--version`, `--help`, and `--verbose` flags
- CLI: Add `data` subcommand that outputs the filepaths to the state file and preferences file

### Changed

- Browser: Adjust high contrast colours
- CLI: Change difficulty flag from `--easy`/`--hard` to `-d`/`--difficulty <easy/hard>`

### Fixed

- CLI: Remove extra space beside revealed word

## [1.2.6] - 2023-10-13

### Added

- Link to releases page on GitHub to version number element in settings page (#87)

## [1.2.5] - 2023-10-08

### Changed

- Invalid within guesses in hard mode that have the same letter already in the guess will now say that the guess needs "another" of that letter (#85)

### Fixed

- Invalid hard mode guesses going through if there's less instances of a letter that are within compared to the previous guess (#85)

### Security

- Bump cypress-real-events from 1.10.1 to 1.10.3 (#83)

## [1.2.4] - 2023-09-23

### Changed
    
- Allow the ability to switch to hard mode after the game is over, on both browser and CLI (#79)

### Fixed

- Retain whether the user won on hard mode or not in the share text, even if they switch difficulty after completing the round (#79)

### Security

- Bump cypress-real-events from 1.9.1 to 1.10.1 (#78)

## [1.2.3] - 2023-08-15

### Added

- Display message if JS is disabled (#75)

### Changed

- Bump sinon, cypress, and cypress-real-events

## [1.2.2] - 2023-02-15

### Changed

- Update hard mode error text to match wording from the real Wordle (#50)
- Letter box border color when filled in (#51)

## [1.2.1] - 2023-02-11

### Added

- Google Analytics event for tracking version number (#49)

### Fixed

- Edge cases in hard mode check (#48)

### Security

- Bump cypress from 12.3.0 to 12.4.1 (#46)
- Bump cypress from 12.4.1 to 12.5.1 (#47)

## [1.2.0] - 2023-01-20

### Added

- Hard mode to both web and CLI (#45)
- Version number to CLI (#45)

### Security

- Bump cypress from 12.2.0 to 12.3.0 (#44)

## [1.1.10] - 2023-01-08

### Changed

- Adjust z-indexes of overlay and snow elements so that snow will dim when overlay is opened (#42)
- Adjust notification style, simplify transition, and add ability to display multiple notifications (#43)

### Security

- Bump cypress-real-events from 1.7.4 to 1.7.6 (#41)

## [1.1.9] - 2022-12-31

### Added

- Link to personal website in footer section (#39)

### Changed

- Re-randomize snow positions when window is resized (for snow theme) (#38)
- Set snowfall to be invisible upon page load (#40)

### Security

- Bump cypress from 10.3.0 to 12.2.0 (#36)

## [1.1.8] - 2022-12-21

### Added

- Snow theme (#35)
- Dependabot and kodiak configs, fix gitpod startup commands (#26)

### Fixed

- State not resetting when word is solved on a different day than when it was first started (#34)
- Issue with landscape MediaQueryList incompatibility preventing game from being loaded on older iOS Safari browsers (#35)

### Security

- Bump mock-fs from 5.1.4 to 5.2.0 (#29)
- Bump cypress-real-events from 1.7.0 to 1.7.4 (#30)
- Bump sinon from 12.0.1 to 15.0.1 (#33)
- Bump mocha from 9.2.2 to 10.2.0 (#28)

## [1.1.7] - 2022-12-11

### Changed

- Rotate device overlay changed to white background with black text if in light mode (c873c33)

### Fixed

- Link for rotate device image (c873c33)
- Build script creating extra images directory after subsequent builds (a41ef1b)

## [1.1.6] - 2022-12-11

### Added

- Version bump script, and move all scripts into "scripts" folder (#23)
- Message overlay covering the game if device is landscape (#25)

### Changed

- Automatically start local server when opened in Gitpod (#24)

## [1.1.5] - 2022-11-12

### Changed

- Disable Google Analytics in Cypress tests (#22)

### Fixed

- Keys can stick in held state when holding down and then going into app switcher at the same time on iOS (#21)

## [1.1.4] - 2022-10-16

### Added

- Ability to erase all letters in a row by holding backspace (#20)

## [1.1.3] - 2022-10-08

### Changed

- Browser theme colour to white when light mode (#19)

## [1.1.2] - 2022-09-06

### Changed

- Update How To Play dialog to accommodate for the High Contrast update (#18)

## [1.1.1] - 2022-09-03

### Added

- High Contrast mode (#16)

### Changed

- Simplify light theme initialization (#16)
- Align columns for settings items (#16)

## [1.1.0] - 2022-08-25

### Added

- Light mode (#15)
- Settings menu (#15)
- Day number to Settings screen (#15)
- Version number to Settings screen (#15)

### Changed

- Overhaul How to Play screen (#15)
- Slightly increase the size of keyboard letters (#15)
- Move copyright from How to Play screen to Settings screen (#15)
- Update font style for most texts to sans-serif (#15)
- Increase the size of dialog boxes to accommodate for the new How to Play screen (#15)

### Fixed

- checkGameValidity throws error on older devices due to nullish coalescing operator (#15)

## [1.0.11] - 2022-08-03

### Changed

- Shift day number by 1 so that March 23 2022 will now be Day 0 (#14)

## [1.0.10] - 2022-08-01

### Changed

- Top bar background colour to black and add bottom border (#13)
- Font of text on top bar (#13)
- Split Cypress tests into separate files (#13)

### Removed

- Day number text from the top bar (#13)

### Fixed

- Day number to reflect true day number (number of days since the first release) (#13)    

## [1.0.9] - 2022-07-09

### Fixed

- Handle feather icons and Sentry failing to load (#11)

## [1.0.8] - 2022-06-20

### Added

- Cypress for testing UI (#9)
- Non-closable dialogs (#9)
- Bounds checking to getWord (#9)
- Keyboard shortcuts for closing dialogs (enter or escape to close) (#9)
- Correct/within/incorrect class names to box element and remove "standard" from its initial class list to make it easier for UI test to pick up whether the box is showing the correct colour based on word correctness (#9)
- New GitHub Action for running Cypress (#9)

### Changed

- Skip Sentry events sent from localhost (#8)
- Handle word fetch errors (#9)
- Only fetch word list once and reuse the word list for getting the word of the day (#9)

### Fixed

- Keyboard size for iPhone 4 and similar sized devices (#9)
- Letters being entered using physical keyboard when dialog is up (#9)
- Browser storage loadGame using fallback lives of 0 instead of 6 if lives entry could not be loaded from local storage (#9)

## [1.0.7] - 2022-06-10

### Added

- Overlay backdrop that will close the dialog box and hide itself when tapped (#6)
- Screenshot to README and bump version (#7)

## [1.0.6] - 2022-05-16

### Added

- Icon for backspace and uppercase keyboard letters (#5)

## [1.0.5] - 2022-04-24

### Fixed

- Countdown interval operating on null countdown element after dialog closed (057359e)

## [1.0.4] - 2022-04-24

### Added

- Countdown to both browser and CLI (#4)
    
### Changed

- "Copied to clipboard" message now displayed as a notification instead of on dialog box so that countdown remains visible after copying
- Adjust design to the edges of the screen in a more responsive manner (#3)
- Standard letter box colour is now black with grey border, more closely resembling the design of the original Wordle

## [1.0.3] - 2022-04-06

### Added

- Basic Sentry error reporting (#1)
- Manifest and app icon for app-like experience when adding app bookmark on iOS or Android (#2)

## [1.0.2] - 2022-03-24

### Added

- Google Analytics (f50c6e0)

### Changed

- Rename the storage test suite (2ef22d1)
- Share button text colour is now always white, even when it's been clicked before (0c663bc)

### Fixed

- Backport gh-pages favicon fix and add favicon to build step (2ef22d1)
- Use legacy execCommand API for copying share text on older browsers (0c663bc)

## [1.0.1] - 2022-03-24

### Added

- Favicon

### Changed

- Slight position adjustment of letters within the boxes
- Update "within" colour

### Fixed

- Backport relative linking fix from gh-pages branch (fc8e4df)

## [1.0.0] - 2022-03-23

Initial Release

[unreleased]: https://github.com/Coteh/wordle-clone/compare/v1.2.7...HEAD
[1.2.7]: https://github.com/Coteh/wordle-clone/compare/v1.2.6...v1.2.7
[1.2.6]: https://github.com/Coteh/wordle-clone/compare/v1.2.5...v1.2.6
[1.2.5]: https://github.com/Coteh/wordle-clone/compare/v1.2.4...v1.2.5
[1.2.4]: https://github.com/Coteh/wordle-clone/compare/v1.2.3...v1.2.4
[1.2.3]: https://github.com/Coteh/wordle-clone/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/Coteh/wordle-clone/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/Coteh/wordle-clone/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/Coteh/wordle-clone/compare/v1.1.10...v1.2.0
[1.1.10]: https://github.com/Coteh/wordle-clone/compare/v1.1.9...v1.1.10
[1.1.9]: https://github.com/Coteh/wordle-clone/compare/v1.1.8...v1.1.9
[1.1.8]: https://github.com/Coteh/wordle-clone/compare/v1.1.7...v1.1.8
[1.1.7]: https://github.com/Coteh/wordle-clone/compare/v1.1.6...v1.1.7
[1.1.6]: https://github.com/Coteh/wordle-clone/compare/v1.1.5...v1.1.6
[1.1.5]: https://github.com/Coteh/wordle-clone/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/Coteh/wordle-clone/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/Coteh/wordle-clone/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/Coteh/wordle-clone/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/Coteh/wordle-clone/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Coteh/wordle-clone/compare/v1.0.11...v1.1.0
[1.0.11]: https://github.com/Coteh/wordle-clone/compare/v1.0.10...v1.0.11
[1.0.10]: https://github.com/Coteh/wordle-clone/compare/v1.0.9...v1.0.10
[1.0.9]: https://github.com/Coteh/wordle-clone/compare/v1.0.8...v1.0.9
[1.0.8]: https://github.com/Coteh/wordle-clone/compare/v1.0.7...v1.0.8
[1.0.7]: https://github.com/Coteh/wordle-clone/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/Coteh/wordle-clone/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/Coteh/wordle-clone/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/Coteh/wordle-clone/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/Coteh/wordle-clone/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/Coteh/wordle-clone/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Coteh/wordle-clone/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Coteh/wordle-clone/releases/tag/v1.0.0
