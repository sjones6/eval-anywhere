#!/bin/bash

set -eou pipefail

tsx ./scripts/zod-to-schemas.ts

pnpm fmt
