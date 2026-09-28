#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "usage: $0 <variants_dir> <shard_count> <last_required_index> <output_dir>" >&2
  exit 2
}

variants_dir="${1:-}"
shard_count="${2:-}"
last_required_index="${3:-}"
output_dir="${4:-}"

test -n "$variants_dir" -a -n "$shard_count" -a \
  -n "$last_required_index" -a -n "$output_dir" || usage
[[ "$shard_count" =~ ^[0-9]+$ ]]
[[ "$last_required_index" =~ ^[0-9]+$ ]]
test "$shard_count" -ge 2
test "$last_required_index" -lt "$shard_count"

inventory="$variants_dir/inventory.tsv"
test -s "$inventory" || {
  echo "Manifest validation requires $inventory." >&2
  exit 1
}

mkdir -p "$output_dir"
inventory_fingerprints="$output_dir/inventory-fingerprints.txt"
inventory_rows="$output_dir/inventory-rows.txt"
required_fingerprints="$output_dir/required-shard-fingerprints.txt"

awk -F '\t' '
  NR == 1 {
    if ($1 != "fingerprint") {
      print "Invalid inventory header." > "/dev/stderr"
      exit 1
    }
    next
  }
  NF < 4 || $1 !~ /^[0-9a-f]{64}$/ {
    print "Invalid inventory row at line " NR "." > "/dev/stderr"
    exit 1
  }
  { print $1 }
' "$inventory" > "$inventory_rows"

sort -u "$inventory_rows" > "$inventory_fingerprints"
test "$(wc -l < "$inventory_rows" | tr -d ' ')" -eq \
  "$(wc -l < "$inventory_fingerprints" | tr -d ' ')" || {
  echo "Duplicate shader fingerprint in inventory." >&2
  exit 1
}

: > "$required_fingerprints"
for ((index = 0; index <= last_required_index; index++)); do
  manifest="$variants_dir/shard-$(printf '%03d' "$index")-of-$(printf '%03d' "$shard_count").tsv"
  test -s "$manifest" || {
    echo "Missing required shard manifest: $manifest" >&2
    exit 1
  }

  awk -F '\t' -v manifest="$manifest" '
    NR == 1 {
      if ($1 != "fingerprint") {
        print "Invalid shard header in " manifest "." > "/dev/stderr"
        exit 1
      }
      next
    }
    NF < 4 || $1 !~ /^[0-9a-f]{64}$/ {
      print "Invalid shard row in " manifest " at line " NR "." > "/dev/stderr"
      exit 1
    }
    { print $1 }
  ' "$manifest" >> "$required_fingerprints"
done

sort "$required_fingerprints" -o "$required_fingerprints"
duplicate="$(uniq -d "$required_fingerprints" | head -n 1 || true)"
test -z "$duplicate" || {
  echo "Duplicate shader fingerprint across required manifests: $duplicate" >&2
  exit 1
}

if [ "$last_required_index" -eq "$((shard_count - 1))" ]; then
  comm -23 "$inventory_fingerprints" "$required_fingerprints" \
    > "$output_dir/shard-gaps.txt"
  comm -13 "$inventory_fingerprints" "$required_fingerprints" \
    > "$output_dir/shard-extras.txt"

  test ! -s "$output_dir/shard-gaps.txt" || {
    echo "Complete shard coverage has gaps." >&2
    head -n 5 "$output_dir/shard-gaps.txt"
    exit 1
  }

  test ! -s "$output_dir/shard-extras.txt" || {
    echo "Complete shard coverage contains fingerprints outside inventory." >&2
    head -n 5 "$output_dir/shard-extras.txt"
    exit 1
  }

  inventory_count="$(wc -l < "$inventory_fingerprints" | tr -d ' ')"
  shard_count_actual="$(wc -l < "$required_fingerprints" | tr -d ' ')"
  test "$inventory_count" -eq "$shard_count_actual" || {
    echo "Complete coverage count mismatch inventory=$inventory_count shards=$shard_count_actual." >&2
    exit 1
  }
  echo "Complete shard coverage PASS inventory=$inventory_count shards=$shard_count_actual count=$shard_count."
else
  echo "Shard manifest prefix PASS through index=$last_required_index count=$(wc -l < "$required_fingerprints" | tr -d ' ')."
fi