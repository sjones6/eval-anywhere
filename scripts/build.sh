#!/bin/bash

rm -rf dist/

npx tsc

sed '1s|^|#!/usr/bin/env node\n\n|' ./dist/cli.js > ./dist/cli.tmp.js && mv ./dist/cli.tmp.js ./dist/cli.js