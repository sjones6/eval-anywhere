#!/bin/bash

set -eou pipefail

rm -rf out

pnpm gen

pnpm build

chmod +x ./dist/cli/index.js

./dist/cli/index.js compile ./cli/commands/prompts -o ./cli/commands/gen -l typescript

pnpm fmt