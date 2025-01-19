#!/bin/sh

cat ./scripts/data/dictionary/popular.txt | grep -E '^[a-z]{5}$' | sort -R > words.txt
