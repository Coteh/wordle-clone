#!/bin/sh

NEW_VERSION_NUMBER=$1

if [ "$NEW_VERSION_NUMBER" = "" ]; then
    >&2 echo "Please specify version"
    exit 1
fi

echo $NEW_VERSION_NUMBER

# Replace the version number in index.html using sed
# (.bak file created for cross-platform compatibility, as some versions of sed require it)
sed -i.bak -r -e "s/(<.+ class=\"version-number\">v)(.+)(<\/.+>)/\1$NEW_VERSION_NUMBER\3/g" \
    -e "s/(const GAME_VERSION = )\"[^\"]*\";/\1\"$NEW_VERSION_NUMBER\";/" index.html

if [ $? != 0 ]; then
    >&2 echo "Failure editing index.html"
    exit 1
fi

rm index.html.bak

# Replace the version number in sw.js using sed
sed -i.bak -r "s/(const VERSION_NUMBER = )'[^']*';/\1'$NEW_VERSION_NUMBER';/" sw.js

rm sw.js.bak

# Perform npm version bump, using --no-git-tag-version so that everything can be committed together
npm version $NEW_VERSION_NUMBER --no-git-tag-version

git add index.html package.json package-lock.json

git commit -m "Version bump"

git tag "v$NEW_VERSION_NUMBER"
