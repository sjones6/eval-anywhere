#!/bin/bash

npx tsc

sed -i '' '1s|^|#!/usr/bin/env node\n\n|' ./dist/cli.js