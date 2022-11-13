#!/bin/sh

NEW_VERSION_NUMBER=$1

if [ "$NEW_VERSION_NUMBER" = "" ]; then
    >&2 echo "Please specify version"
    exit 1
fi

echo $NEW_VERSION_NUMBER

# Replace the version number in index.html (Note: Only tested with GNU sed)
sed -i.bak -r -e "s/(<.+ class=\"version-number\">v)(.+)(<\/.+>)/\1$NEW_VERSION_NUMBER\3/g" -e "s/(release: \"wordle-clone@)(.+)(\",)/\1$NEW_VERSION_NUMBER\3/g" index.html

rm index.html.bak

# Perform npm version bump, using --no-git-tag-version so that everything can be committed together
npm version $NEW_VERSION_NUMBER --no-git-tag-version

git add index.html package.json package-lock.json

git commit -m "Version bump"
