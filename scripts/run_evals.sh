#!/bin/bash

rm -rf out

pnpm build

chmod +x ./dist/index.js

./dist/index.js eval ./examples