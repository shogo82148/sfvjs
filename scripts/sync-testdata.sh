#!/usr/bin/env bash

set -uex

CURRENT=$(cd "$(dirname "$0")" && pwd)
cd "$CURRENT/.."

OWNER=httpwg
REPO=structured-field-tests
SHA=$(gh api --jq '.commit.sha' "repos/$OWNER/$REPO/branches/main")

rm -rf structured-field-tests
mkdir -p structured-field-tests
curl -sSL "https://github.com/$OWNER/$REPO/archive/$SHA.tar.gz" | tar xz -C structured-field-tests --strip=1

git add structured-field-tests
git commit -m "sync test cases with https://github.com/$OWNER/$REPO/commit/$SHA"
