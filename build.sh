#!/bin/sh

OUTPUT_DIR=./build

mkdir -p $OUTPUT_DIR/src/storage
mkdir -p $OUTPUT_DIR/src/share

cp index.html $OUTPUT_DIR
cp index.css $OUTPUT_DIR
cp src/*.js $OUTPUT_DIR/src
cp src/storage/index.js $OUTPUT_DIR/src/storage
cp src/storage/browser.js $OUTPUT_DIR/src/storage
cp src/share/index.js $OUTPUT_DIR/src/share
cp src/share/browser.js $OUTPUT_DIR/src/share
cp favicon.ico $OUTPUT_DIR
cp icon*.png $OUTPUT_DIR
cp manifest.json $OUTPUT_DIR
cp words.txt $OUTPUT_DIR
