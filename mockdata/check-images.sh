#!/bin/sh
# ponytail: product photos are hotlinked, so the only failure mode worth a check is link rot.
# Run: sh mockdata/check-images.sh
fail=0
for url in $(grep -o 'image: "[^"]*"' "$(dirname "$0")/index.ts" | cut -d'"' -f2); do
  code=$(curl -sIL -A "Mozilla/5.0" -o /dev/null -w "%{http_code}" --max-time 20 "$url")
  [ "$code" = "200" ] || { echo "DEAD $code $url"; fail=1; }
done
[ "$fail" = "0" ] && echo "all product images OK"
exit $fail
