#!/bin/bash

set -eou pipefail

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
    | prettier --parser typescript > ./cli/gen/$name.ts
}

BANNER_COMMENT="/* eslint-disable */"

generate_ts_from_jsonschema () {
  cat "$1" | json2ts --bannerComment="$BANNER_COMMENT" --format=false --additionalProperties=false > "$2"
}

generate_zod_from_schema schemas/prompt-schema.yaml.json prompt
generate_zod_from_schema schemas/eval-schema.yaml.json evaluation

generate_ts_from_jsonschema schemas/prompt-schema.yaml.json ./templates/typescript/types.ts

pnpm fmt


