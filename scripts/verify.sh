#!/usr/bin/env bash
set -euo pipefail

out=".verify_out"
rm -rf "$out"
mkdir -p "$out"

ok() { echo "OK  - $1"; }
fail() { echo "FAIL- $1"; exit 1; }

run_and_diff() {
  local src="$1"
  local outFile="$2"
  local filter="$3"
  shift 3 || true
  npm start "$src" "$out/$outFile" $filter "$@" >/dev/null
  diff -q "ImageEditorFiles/key_images/$outFile" "$out/$outFile" >/dev/null && ok "$outFile" || fail "$outFile"
}

# grayscale
for n in feep one-does-not-simply Penguins sunset tiny; do
  run_and_diff "ImageEditorFiles/source_images/$n.ppm" "grayscale-$n.ppm" grayscale
done

# invert
for n in feep one-does-not-simply Penguins sunset tiny; do
  run_and_diff "ImageEditorFiles/source_images/$n.ppm" "invert-$n.ppm" invert
done

# emboss
for n in feep one-does-not-simply Penguins sunset tiny; do
  run_and_diff "ImageEditorFiles/source_images/$n.ppm" "emboss-$n.ppm" emboss
done

# motion blur (lengths tuned to match keys)
run_and_diff "ImageEditorFiles/source_images/feep.ppm" "motionblur-feep.ppm" motionblur 4
run_and_diff "ImageEditorFiles/source_images/tiny.ppm" "motionblur-tiny.ppm" motionblur 3
for n in one-does-not-simply Penguins sunset; do
  run_and_diff "ImageEditorFiles/source_images/$n.ppm" "motionblur-$n.ppm" motionblur 10
done

echo "All comparisons matched."
exit 0

