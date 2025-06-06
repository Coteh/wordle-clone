#!/bin/sh

set -e

DEPLOY_ENV="$1"
MAGICK=magick

if [ "$DEPLOY_ENV" = "" ]; then
    echo >&2 "Please specify an env"
    exit 1
fi

# Mark the nonprod icons as unchanged in git
git update-index --assume-unchanged icon128_nonprod.png
git update-index --assume-unchanged icon152_nonprod.png

"$MAGICK" icon152.png -gravity south -fill black -undercolor '#FFFFFF' -pointsize 42 -font ./scripts/fonts/Lato/Lato-Black.ttf -annotate +0+10 "$DEPLOY_ENV" "icon152_nonprod.png"
"$MAGICK" icon128.png -gravity south -fill black -undercolor '#FFFFFF' -pointsize 36 -font ./scripts/fonts/Lato/Lato-Black.ttf -annotate +0+10 "$DEPLOY_ENV" "icon128_nonprod.png"
