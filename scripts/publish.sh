#!/bin/bash

ROOT=$(git rev-parse --show-toplevel)

set -euxo pipefail
cd "$ROOT"

# publish to jsr
deno publish

# npm publish
deno run -A scripts/build_npm.ts "$(jq -r .version deno.json)"
cd npm
npm publish --access public --provenance
