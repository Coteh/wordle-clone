#!/bin/sh

set -e

DEPLOY_ENV="$1"

if [ "$DEPLOY_ENV" = "" ]; then
    echo >&2 "Please specify an env"
    exit 1
fi

magick icon152.png -gravity south -fill black -undercolor '#FFFFFF' -pointsize 42 -annotate +0+10 "$DEPLOY_ENV" icon152_nonprod.png
magick icon128.png -gravity south -fill black -undercolor '#FFFFFF' -pointsize 36 -annotate +0+10 "$DEPLOY_ENV" icon128_nonprod.png
