#!/bin/bash

rm -rf out

pnpm build

./dist/cli.js eval ./examples/base -o ./out/evals/eval-results.json

tsx ./examples/customized/customized-cli.ts eval ./examples/customized -o ./out/evals/custom-eval-results.json