#!/bin/sh

set -e

DEPLOY_ENV="$1"
OUTPUT_DIR=./build

mkdir -p $OUTPUT_DIR/src/storage
mkdir -p $OUTPUT_DIR/src/share
mkdir -p $OUTPUT_DIR/vendor
mkdir -p $OUTPUT_DIR/images

cp index.html $OUTPUT_DIR
cp index.css $OUTPUT_DIR
cp src/*.js $OUTPUT_DIR/src
cp src/storage/index.js $OUTPUT_DIR/src/storage
cp src/storage/browser.js $OUTPUT_DIR/src/storage
cp src/share/index.js $OUTPUT_DIR/src/share
cp src/share/browser.js $OUTPUT_DIR/src/share
cp vendor/*.js $OUTPUT_DIR/vendor
cp images/*.png $OUTPUT_DIR/images
cp favicon.ico $OUTPUT_DIR
cp manifest.json $OUTPUT_DIR
cp words.txt $OUTPUT_DIR

if [ "$DEPLOY_ENV" != "" ]; then
    ./scripts/gen_nonprod_icon.sh "$DEPLOY_ENV"
    for file in icon*_nonprod.png; do
        cp "$file" "$OUTPUT_DIR/$(basename "$file" _nonprod.png).png"
        if [ "$?" = 0 ]; then
            rm "$file"
        fi
    done
else
    cp icon*.png $OUTPUT_DIR
fi
