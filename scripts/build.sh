#!/bin/bash

rm -rf dist/

npx tsc

sed -i '' '1s|^|#!/usr/bin/env node\n\n|' ./dist/index.js