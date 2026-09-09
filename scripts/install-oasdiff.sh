#!/usr/bin/env bash
# Installs the ONE oasdiff build the breaking-change judge accepts (M26) into .tools/oasdiff/,
# on a developer machine and in CI alike, so the two can never judge with different rulebooks:
# a value added to a response enum is a warning in one release and an error in the next, and
# the gate is only as honest as the build behind it. The pin — version and the sha256 of each
# release archive — is scripts/oasdiff-pin.json, read here and by check-openapi-breaking.mjs;
# bump both halves together from the release's checksums.txt.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
pin="$root/scripts/oasdiff-pin.json"
version="$(node -p "require('$pin').version")"
dest="$root/.tools/oasdiff"
bin="$dest/oasdiff"

if [ -x "$bin" ] && [ "$("$bin" --version 2>/dev/null | awk '{print $NF}')" = "$version" ]; then
  echo "oasdiff $version already installed at $bin"
  exit 0
fi

case "$(uname -s)/$(uname -m)" in
  Darwin/*) archive="darwin_all" ;;
  Linux/x86_64) archive="linux_amd64" ;;
  Linux/aarch64 | Linux/arm64) archive="linux_arm64" ;;
  *) echo "install-oasdiff: no pinned archive for $(uname -s)/$(uname -m)" >&2; exit 1 ;;
esac
expected="$(node -p "require('$pin').archives['$archive'] ?? ''")"
[ -n "$expected" ] || { echo "install-oasdiff: no checksum pinned for $archive" >&2; exit 1; }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
file="oasdiff_${version}_${archive}.tar.gz"
curl -fsSL -o "$tmp/$file" "https://github.com/oasdiff/oasdiff/releases/download/v${version}/${file}"
actual="$( (command -v sha256sum >/dev/null && sha256sum "$tmp/$file" || shasum -a 256 "$tmp/$file") | awk '{print $1}')"
[ "$actual" = "$expected" ] || {
  echo "install-oasdiff: checksum mismatch for $file (expected $expected, got $actual)" >&2
  exit 1
}

mkdir -p "$dest"
tar -xzf "$tmp/$file" -C "$tmp"
found="$(find "$tmp" -type f -name oasdiff | head -1)"
[ -n "$found" ] || { echo "install-oasdiff: no oasdiff binary in $file" >&2; exit 1; }
mv "$found" "$bin"
chmod +x "$bin"
echo "oasdiff $("$bin" --version | awk '{print $NF}') installed at $bin"
