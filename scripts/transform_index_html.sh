#!/bin/sh

OUTPUT_DIR="$1"
IS_DEV="$2"

COMMIT_HASH=$(git rev-parse --short HEAD)

cp index.html "$OUTPUT_DIR"

# Replace the commit hash in index.html using sed
# (.bak file created for cross-platform compatibility, as some versions of sed require it)
sed -i.bak -r -e "s/(<.+ class=\"commit-hash\">)(.+)(<\/.+>)/\1$COMMIT_HASH\3/g" "$OUTPUT_DIR/index.html"

if [ $? != 0 ]; then
    >&2 echo "Failure building index.html"
    exit 1
fi

# Remove canonical link in dev builds
if [ "$IS_DEV" = "true" ]; then
    sed -i.bak -r -e "/<link.+rel=\"canonical\">/d" "$OUTPUT_DIR/index.html"
    
    if [ $? != 0 ]; then
        >&2 echo "Failure removing canonical link from index.html"
        exit 1
    fi
fi

rm -f "$OUTPUT_DIR/index.html.bak"
