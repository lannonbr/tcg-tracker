#!/bin/env bash

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
chart_dir="$(cd -- "$script_dir/../.." && pwd)"
repo_dir="$(cd -- "$chart_dir/../.." && pwd)"

cd "$chart_dir"

source "$repo_dir/.env.local"

helm upgrade --install \
  -n tcg-tracker --create-namespace \
  tcg-tracker \
  --set convexUrl=$CONVEX_URL \
  --set convexSiteUrl=$CONVEX_SITE_URL \
  .
