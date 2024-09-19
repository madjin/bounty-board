#!/bin/bash

for i in *; do
  if jq -e . >/dev/null 2>&1 < "$i"; then
    jq -r '.image' "$i" | xargs -I {} wget -nc '{}'
    sleep 1
  else
    echo "$i is not a valid JSON file."
  fi
done
