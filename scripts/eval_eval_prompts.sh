#!/bin/bash

set -eou pipefail

######
#
# This is a bit meta, and uses the eval framework to run evals on prompts that are 
# used as part of the eval framework.
#
###

# first we need to build the CLI
./scripts/gen_eval_prompts.sh

./dist/cli/index.js eval ./cli/commands/prompts