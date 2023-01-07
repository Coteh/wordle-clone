# wordle-clone

[![Run Tests](https://github.com/Coteh/wordle-clone/actions/workflows/run-tests.yml/badge.svg)](https://github.com/Coteh/wordle-clone/actions/workflows/run-tests.yml)
[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-908a85?logo=gitpod)](https://gitpod.io/#https://github.com/Coteh/wordle-clone)

### [**Click here to play**](https://coteh.github.io/wordle-clone)

![Browser Game Screenshot](screenshot.gif "Browser Game Screenshot")

A clone of the worldwide phenomenon known as [Wordle](https://www.powerlanguage.co.uk/wordle/).

Can be played on either the browser or the command line.

## Setup

### Browser

[Click here to play on the browser](https://coteh.github.io/wordle-clone)

### CLI

Clone this repository, then run the following:

```
npm install --production
```

Then run the following to link it to your PATH:

```
npm link
```

Now you can run it using the following command:

```
wordle
```

## Features

- Base game
    - Browser version
    - CLI version
- Share functionality
- Countdown to next day's Wordle

## Development

Clone this repository, then run the following:

```
npm install
```

It's also a good idea to scramble the words when working on the project, to prevent spoilers:

```
./scripts/gen_word_list.sh
```

The following will make it so that git doesn't detect that `words.txt` changed:

```
git update-index --assume-unchanged words.txt
```

At this point, you can run a local web server on the project directory, and the game should render when navigating to the port of the server from your browser.

## Testing

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

- Hard Mode
- Player Statistics
- Archive
- Animations
- Code cleanup
