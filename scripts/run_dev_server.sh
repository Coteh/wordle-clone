#!/bin/sh

set -e

DEV_SERVER="$(pwd)/node_modules/.bin/serve --config serve.json"
DEV_SERVER_TYPE="$1"
DEPLOY_ENV="$2"
OUTPUT_DIR=./build

# Create build directory to put the modified icons in
mkdir -p $OUTPUT_DIR

# Modify app icons so that they have the label supplied by $DEPLOY_ENV to them
./scripts/gen_nonprod_icon.sh "$DEPLOY_ENV"
for file in icon*_nonprod.png; do
    cp "$file" "$OUTPUT_DIR/$(basename "$file" _nonprod.png).png"
    if [ "$?" = 0 ]; then
        rm "$file"
    fi
done

# Serve the dev server
if [ "$DEV_SERVER_TYPE" = "HTTPS" ]; then
    $DEV_SERVER -p 5501 --ssl-cert ./ssl/localhost+2.pem --ssl-key ./ssl/localhost+2-key.pem
else
    $DEV_SERVER -p 5500
fi
