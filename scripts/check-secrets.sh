#!/usr/bin/env bash
# The secret scan at pre-commit: the staged change, with the same rules and allowlist CI uses
# (.gitleaks.toml). Fails closed when the scanner is missing — a scan that silently did not run
# is how a key reaches the remote, and CI would only tell you after the push.
set -euo pipefail

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "check:secrets — gitleaks is not installed, so the staged change was NOT scanned." >&2
  echo "  Install it once: brew install gitleaks   (README.md, Local setup)" >&2
  exit 1
fi

gitleaks git --pre-commit --staged --config .gitleaks.toml --redact --no-banner --exit-code 1
