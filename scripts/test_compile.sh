#!/bin/bash

set -eou pipefail

rm -rf out

pnpm gen

pnpm build

chmod +x ./dist/index.js

./dist/index.js compile ./examples -o ./out/typescript -l typescript