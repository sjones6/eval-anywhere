#!/bin/bash

rm -rf dist/

npx tsc

sed '1s|^|#!/usr/bin/env node\n\n|' ./dist/cli/index.js > ./dist/cli/index.tmp.js && mv ./dist/cli/index.tmp.js ./dist/cli/index.js