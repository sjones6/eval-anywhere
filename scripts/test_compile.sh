#!/bin/bash

rm -rf out

pnpm build

chmod +x ./dist/index.js

./dist/index.js compile ./examples -o ./out/typescript -l typescript