#!/bin/sh

OUTPUT_FILE=screenshot.gif

WIDTH=286
HEIGHT=624
X=722
Y=80

# Install Cypress first before running this script

./node_modules/.bin/cypress run --spec cypress/e2e/misc/screenshot.cy.js

# Crop filter adapted from: https://video.stackexchange.com/a/4571
# GIF filters adapted from: https://superuser.com/a/556031

ffmpeg -y -ss 5 -i cypress/videos/screenshot.cy.js.mp4 -filter:v "crop=$WIDTH:$HEIGHT:$X:$Y,fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 $OUTPUT_FILE
