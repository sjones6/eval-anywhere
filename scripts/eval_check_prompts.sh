#!/bin/bash

set -eou pipefail

######
#
# This is a bit meta, and uses the eval framework to run evals on prompts that are 
# used as part of the eval framework.
#
###

# first we need to build the CLI
# and generate the prompts
pnpm build

# then run evals on them
./dist/cli.js eval ./src/evals/prompts -o ./out/results/check-prompt-eval-results.json