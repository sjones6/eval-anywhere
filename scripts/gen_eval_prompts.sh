#!/bin/bash

set -eou pipefail

pnpm build

pnpm gen

chmod +x ./dist/cli/index.js

rm -rf ./cli/commands/gen

./dist/cli/index.js compile ./cli/commands/prompts -o ./cli/commands/gen -l typescript

pnpm fmt