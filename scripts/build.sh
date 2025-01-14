#!/bin/bash

set -eou pipefail

rm -rf dist/

npx tsc

sed '1s|^|#!/usr/bin/env node\n\n|' ./dist/cli.js > ./dist/cli.tmp.js && mv ./dist/cli.tmp.js ./dist/cli.js

chmod +x ./dist/cli.js

tsx ./src/cli.ts schema --out ./schemas/prompt.yaml.json

tsx ./examples/customized/customized-cli.ts schema --out ./examples/customized/with_custom_check_prompt_schema.json

pnpm fmt