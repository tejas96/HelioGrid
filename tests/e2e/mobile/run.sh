#!/usr/bin/env bash
# The phone suite on ONE device: every flow in this folder, in the order a new person meets the
# screens — `bash mobile/run.sh <device id>`, a simulator UDID or an emulator serial. Each phone takes
# its own call, and two calls may run at the same time.
# Metro, the api and the device are already up, and the app is installed. Maestro reads no file
# mid-flow, so between the number and the code this script reads the code the api sent
# (support/mobile-cli.ts) and hands it to the next flow.
set -euo pipefail
cd "$(dirname "$0")"
[ $# -eq 1 ] || { echo 'usage: bash mobile/run.sh <device id>' >&2; exit 2; }
device="$1"
export MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true
# Milliseconds the driver may take to start. iOS's 120000 default timed out on a cold simulator.
export MAESTRO_DRIVER_STARTUP_TIMEOUT=180000

words=()
while IFS= read -r line; do words+=(-e "$line"); done < <(node ../support/mobile-cli.ts words)
flow() { maestro --device "$device" test "${words[@]}" "$@"; }

read -r national e164 < <(node ../support/mobile-cli.ts phone)
flow boot.yaml
flow invite-landing.yaml
since="$(node -e 'console.log(Date.now())')"
flow -e "PHONE=$national" login.yaml
code="$(node ../support/mobile-cli.ts code "$e164" "$since")"
flow -e "CODE=$code" steps/enter-code.yaml
flow -e "COMPANY=E2E $national" -e "OWNER=Owner $national" company-signup.yaml

# A second fresh number whose company the api makes, so the flows reach the screens a member with
# a company meets: setup's steps, the shell and settings. The phone's own *Create company* press
# never reaches the api on iOS inside Maestro (`D5`), so it is not the way in.
read -r owner_national owner_e164 < <(node ../support/mobile-cli.ts phone)
node ../support/mobile-cli.ts company "$owner_national" "$owner_e164"
flow boot.yaml
since="$(node -e 'console.log(Date.now())')"
flow -e "PHONE=$owner_national" login.yaml
code="$(node ../support/mobile-cli.ts code "$owner_e164" "$since")"
flow -e "CODE=$code" steps/enter-code.yaml
flow setup-language.yaml
flow setup-what-you-sell.yaml
flow company-profile.yaml
flow setup-invite-team.yaml
flow setup-ready.yaml
flow shell.yaml
flow settings.yaml
flow profile.yaml
flow team.yaml
flow roles-reference.yaml
flow branding.yaml
flow proposal-template.yaml
flow payment-terms.yaml
flow catalog-settings.yaml
echo "mobile suite PASS on $device"
