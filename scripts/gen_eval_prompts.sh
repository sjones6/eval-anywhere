#!/bin/bash

set -eou pipefail

pnpm build

pnpm gen

chmod +x ./dist/cli.js

./dist/cli.js compile ./src/evals/prompts -o ./src/evals/gen -l typescript

pnpm fmt