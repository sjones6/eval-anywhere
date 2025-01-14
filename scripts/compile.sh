#!/bin/bash

set -eou pipefail

rm -rf out

pnpm build

# compile prompts used by core eval checks 
./dist/cli.js compile ./src/evals/prompts -o ./src/evals/gen -l typescript

# base compilation
./dist/cli.js compile ./examples/base -o ./out/base/typescript -l typescript
./dist/cli.js compile ./examples/base -o ./out/base/deno -l deno
./dist/cli.js compile ./examples/base -o ./out/base/node -l node
./dist/cli.js compile ./examples/base -o ./out/base/node-esm -l node-esm
./dist/cli.js compile ./examples/base -o ./out/base/node-cjs -l node-cjs

# customized compilation
tsx ./examples/customized/customized-cli.ts compile ./examples/customized -o ./out/customized/typescript -l typescript
tsx ./examples/customized/customized-cli.ts compile ./examples/customized -o ./out/customized/deno -l deno
tsx ./examples/customized/customized-cli.ts compile ./examples/customized -o ./out/customized/node -l node
tsx ./examples/customized/customized-cli.ts compile ./examples/customized -o ./out/customized/node-esm -l node-esm
tsx ./examples/customized/customized-cli.ts compile ./examples/customized -o ./out/customized/node-cjs -l node-cjs

pnpm fmt