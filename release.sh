#!/bin/bash
# This script is used to release a new version of the project.
VERSION=$1
ROOT=$(git rev-parse --show-toplevel)

set -euxo pipefail
cd "$ROOT"

# update the version information.
jq --arg new_version "$VERSION" '.version = $new_version' deno.json > deno.json.tmp
mv deno.json.tmp deno.json

# commit the changes.
git add deno.json
git commit -m "bump v$VERSION"
git push origin main

# create a new tag.
git tag "v$VERSION"
git push origin "v$VERSION"
