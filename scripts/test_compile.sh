#!/bin/bash

set -eou pipefail

rm -rf out

pnpm gen

pnpm build

chmod +x ./dist/cli.js

./dist/cli.js compile ./examples -o ./out/typescript -l typescript
./dist/cli.js compile ./examples -o ./out/deno -l deno
./dist/cli.js compile ./examples -o ./out/node -l node
./dist/cli.js compile ./examples -o ./out/node-esm -l node-esm
./dist/cli.js compile ./examples -o ./out/node-cjs -l node-cjs