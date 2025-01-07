#!/bin/sh

set -e

DEV_SERVER="$(pwd)/node_modules/.bin/serve"
DEV_SERVER_TYPE="$1"
DEPLOY_ENV="$2"
OUTPUT_DIR=./build
MAGICK=magick

# If ImageMagick is installed on the system, then perform app icon modification so that it has a label on it
if [ -x "$(command -v $MAGICK)" ]; then
    # Modify app icons so that they have the label supplied by $DEPLOY_ENV on them
    ./scripts/gen_nonprod_icon.sh "$DEPLOY_ENV"
else
    echo "ImageMagick not installed on system, skipping icon modification..."
fi

# Create build directory to put the modified icons in
mkdir -p $OUTPUT_DIR

for file in icon*_nonprod.png; do
    cp "$file" "$OUTPUT_DIR/$(basename "$file" _nonprod.png).png"
done

DEV_SERVER="$DEV_SERVER --config ./config/serve.json"

# Serve the dev server
if [ "$DEV_SERVER_TYPE" = "HTTPS" ]; then
    $DEV_SERVER -p 5501 --ssl-cert ./ssl/localhost+2.pem --ssl-key ./ssl/localhost+2-key.pem
else
    $DEV_SERVER -p 5500
fi
