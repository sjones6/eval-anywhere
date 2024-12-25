#!/bin/bash

set -eou pipefail

rm -rf out

pnpm gen

pnpm build

chmod +x ./dist/cli/index.js

./dist/cli/index.js compile ./examples -o ./out/typescript -l typescript
./dist/cli/index.js compile ./examples -o ./out/deno -l deno
./dist/cli/index.js compile ./examples -o ./out/node -l node
./dist/cli/index.js compile ./examples -o ./out/node-esm -l node-esm
./dist/cli/index.js compile ./examples -o ./out/node-cjs -l node-cjs