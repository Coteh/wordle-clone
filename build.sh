#!/bin/sh

mkdir -p build/src/storage
mkdir -p build/src/share

cp index.html ./build
cp index.css ./build
cp src/*.js ./build/src
cp src/storage/index.js ./build/src/storage
cp src/storage/browser.js ./build/src/storage
cp src/share/index.js ./build/src/share
cp src/share/browser.js ./build/src/share
cp favicon.ico ./build
cp words.txt ./build
