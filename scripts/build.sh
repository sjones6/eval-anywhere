#!/bin/bash

rm -rf dist/

npx tsc

sed '1s|^|#!/usr/bin/env node\n\n|' ./dist/index.js > ./dist/index.tmp.js && mv ./dist/index.tmp.js ./dist/index.js