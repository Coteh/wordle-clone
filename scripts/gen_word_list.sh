#!/bin/sh

# TODO cache the file as well and add cached file to .gitignore
curl https://raw.githubusercontent.com/dolph/dictionary/17cda9807b913d77f0c08fa0536087e1830d68d8/popular.txt | grep -E '^[a-z]{5}$' | sort -R > words.txt
