#!/bin/bash

set -eou pipefail

BANNER_COMMENT="/* eslint-disable */"

generate_ts_from_jsonschema () {
  cat "$1" | json2ts --bannerComment="$BANNER_COMMENT" --format=false --additionalProperties=false > "$2"
}

tsx ./scripts/zod-to-schemas.ts

# generate_ts_from_jsonschema schemas/prompt.yaml.json ./templates/typescript/types.ts

pnpm fmt


