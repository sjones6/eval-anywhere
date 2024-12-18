#!/bin/bash

rm -rf ./src/gen/*

mkdir -p ./src/gen

to_pascal_case() {
    # Use Node.js to capitalize each word and remove spaces
    echo $(node -e "console.log('$1'.split(/[\s_-]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(''))")
}

replace_spaces () {
  echo "$1" | sed 's/ /_/g'
}

generate_zod_from_schema () {
  name=$(replace_spaces "$2")
  pascal_name=$(to_pascal_case "$name")
  json-refs resolve $1 \
    | json-schema-to-zod -n $name -m esm --type $pascal_name \
    | prettier --parser typescript > ./src/gen/$name.ts
}

generate_zod_from_schema prompt-schema.yaml.json prompt


