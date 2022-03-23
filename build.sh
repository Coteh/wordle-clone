#!/bin/sh

mkdir -p build/src/storage

cp index.html ./build
cp index.css ./build
cp src/*.js ./build/src
cp src/storage/index.js ./build/src/storage
cp src/storage/browser.js ./build/src/storage
cp words.txt ./build
