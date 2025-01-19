#!/bin/sh

OUTPUT_DIR="$1"

COMMIT_HASH=$(git rev-parse --short HEAD)

cp index.html $OUTPUT_DIR

# Replace the commit hash in index.html using sed
# (.bak file created for cross-platform compatibility, as some versions of sed require it)
sed -i.bak -r -e "s/(<.+ class=\"commit-hash\">)(.+)(<\/.+>)/\1$COMMIT_HASH\3/g" $OUTPUT_DIR/index.html

if [ $? != 0 ]; then
    >&2 echo "Failure building index.html"
    exit 1
fi

rm $OUTPUT_DIR/index.html.bak
