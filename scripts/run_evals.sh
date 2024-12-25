#!/bin/bash

rm -rf out

pnpm build

chmod +x ./dist/cli/index.js

./dist/cli/index.js eval ./examples