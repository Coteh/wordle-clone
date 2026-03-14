#!/bin/sh

OUTPUT_DIR="$1"

COMMIT_HASH=$(git rev-parse --short HEAD)

cp sw.js $OUTPUT_DIR

# Replace the commit hash in sw.js using sed
# (.bak file created for cross-platform compatibility, as some versions of sed require it)
sed -i.bak -r "s/(const COMMIT_HASH = )'[^']*';/\1'$COMMIT_HASH';/" $OUTPUT_DIR/sw.js

if [ $? != 0 ]; then
    >&2 echo "Failure building sw.js"
    exit 1
fi

rm $OUTPUT_DIR/sw.js.bak
