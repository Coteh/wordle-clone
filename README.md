# wordle-clone

[![Run Tests](https://github.com/Coteh/wordle-clone/actions/workflows/run-tests.yml/badge.svg)](https://github.com/Coteh/wordle-clone/actions/workflows/run-tests.yml)
[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-908a85?logo=gitpod)](https://gitpod.io/#https://github.com/Coteh/wordle-clone)

### [**Click here to play on browser**](https://coteh.github.io/wordle-clone)

![Browser Game Screenshot](screenshot.gif "Browser Game Screenshot")

A clone of the worldwide phenomenon known as [Wordle](https://www.powerlanguage.co.uk/wordle/).

Can be played on either the browser or the command line.

## Features

- Base game
    - Browser version
    - CLI version
- Share functionality
- Countdown to next day's Wordle
- Hard Mode

## Setup

### Browser

[Click here to play on the browser](https://coteh.github.io/wordle-clone)

### CLI

Assuming you have [Node.js](https://nodejs.org) and npm installed, run the following command to install the game:

```
npm install -g wordle-clone
```

Now you can run it using the following command:

```
wordle
# or, alternatively:
# wordle-clone
```

#### CLI arguments

```
  -d, --difficulty <string>  change game difficulty (choices: "hard", "easy")
  -v, --verbose              print extra information
  -h, --help                 display help for command
  -V, --version              output the version number
```

#### Preferences

Preferences are stored in the following locations (depending on OS):
- `$HOME/.config/wordle-clone/preferences.json` (Linux)
- `/Users/<username>/Library/Application Support/wordle-clone/preferences.json` (macOS)
- `C:\Users\<username>\AppData\Roaming\wordle-clone\Config\preferences.json` (Windows)

To find where it's located on your machine, you can use the Game Data Subcommand (see [Game Data Subcommand Usage](#game-data-subcommand-usage) for full usage). You can output the preferences filepath by running `wordle data -p`.

In this file, you can specify the following options in JSON format:
| Option | Type | Description | Default Value |
| ------ | ---- | ----------- | ------------- |
| `hardMode` | `boolean` | Whether to enable hard mode | `false` |
| `highContrast` | `boolean` | Whether to turn on high contrast mode | `false` |

Example:
```
{
    "hardMode": true,
    "highContrast": false
}
```

##### Game Data Subcommand Usage

```
Usage: wordle-clone data [options]

outputs the filepath of game state and/or preferences

Options:
  -p, --preferences  output preferences filepath
  -s, --state        output game state filepath
  -h, --help         display help for command
```

## Development

Clone this repository, then run the following:

```
npm install
```

It's also a good idea to scramble the words when working on the project, to prevent spoilers:

```
./scripts/gen_word_list.sh
```

(Note: If you're on Windows, run the script in WSL)

The following will make it so that git doesn't detect that `words.txt` changed:

```
git update-index --assume-unchanged words.txt
```

At this point, you can run a local web server on the project directory, and the game should render when navigating to the port of the server from your browser.

## Testing

Run the following to launch unit tests:

```
npm run test
```

Cypress tests can be accessed by running the following:

```
npm run cypress open
```

This will launch the tests in the Cypress UI. 

Alternatively, you can run the tests directly on CLI:

```
npm run cypress run
```

## Future Additions

- Player Statistics
- Archive
- Animations
- Code cleanup
