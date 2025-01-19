#!/bin/sh

set -e

DEPLOY_ENV="$1"
OUTPUT_DIR=./build

mkdir -p $OUTPUT_DIR/src/storage
mkdir -p $OUTPUT_DIR/src/share
mkdir -p $OUTPUT_DIR/vendor
mkdir -p $OUTPUT_DIR/images

./scripts/transform_index_html.sh $OUTPUT_DIR

cp index.css $OUTPUT_DIR
cp src/*.js $OUTPUT_DIR/src
cp src/storage/index.js $OUTPUT_DIR/src/storage
cp src/storage/browser.js $OUTPUT_DIR/src/storage
cp src/share/index.js $OUTPUT_DIR/src/share
cp src/share/browser.js $OUTPUT_DIR/src/share
cp vendor/*.js $OUTPUT_DIR/vendor
cp vendor/*.css $OUTPUT_DIR/vendor
cp images/*.png $OUTPUT_DIR/images
cp favicon.ico $OUTPUT_DIR
cp manifest.json $OUTPUT_DIR
cp words.txt $OUTPUT_DIR

if [ "$DEPLOY_ENV" != "" ]; then
    MAGICK=magick

    # If ImageMagick is installed on the system, then perform app icon modification so that it has a label on it
    if [ -x "$(command -v $MAGICK)" ]; then
        # Modify app icons so that they have the label supplied by $DEPLOY_ENV on them
        ./scripts/gen_nonprod_icon.sh "$DEPLOY_ENV"
    else
        echo "ImageMagick not installed on system, skipping icon modification..."
    fi

    for file in icon*_nonprod.png; do
        cp "$file" "$OUTPUT_DIR/$(basename "$file" _nonprod.png).png"
    done
else
    for file in $(ls icon*.png | grep -v _nonprod); do
        cp "$file" "$OUTPUT_DIR"
    done
fi

# Generate changelog HTML and copy it to the build directory
./scripts/gen_changelog_html.js > $OUTPUT_DIR/CHANGELOG.html
