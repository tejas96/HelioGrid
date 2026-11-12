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

# Read into a variable first: a process substitution's failure never stops `set -e`, and the words
# step fails on a flow word nothing writes.
written="$(node ../support/mobile-cli.ts words)"
words=()
while IFS= read -r line; do words+=(-e "$line"); done <<< "$written"
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
# It also makes three leads given to the owner: one for Lead Detail, that customer and the same
# family's second record for Customer Merge, and one it marks won, whose project the projects flows
# open — their ids come back.
read -r lead_id survivor_id loser_id project_id < <(node ../support/mobile-cli.ts company "$owner_national" "$owner_e164")
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
flow collections-settings.yaml
flow catalog-settings.yaml
flow billing.yaml
flow usage.yaml
# A customer's fresh number, so the capture meets no lead another run left.
read -r customer_national _ < <(node ../support/mobile-cli.ts phone)
flow -e "CUSTOMER=$customer_national" quick-add-lead.yaml
# The lead quick add just captured is the inbox's one waiting lead.
flow lead-inbox.yaml
# Search finds that lead by its customer's number, and a fresh number finds nothing.
read -r nobody_national _ < <(node ../support/mobile-cli.ts phone)
flow -e "CUSTOMER=$customer_national" -e "NOBODY=$nobody_national" search.yaml
flow -e "LEAD_NAME=Lead $owner_national" leads-list.yaml
# The import opens on its first step over the same list, and its way back returns to it.
flow lead-import.yaml
flow -e "LEAD_ID=$lead_id" -e "LEAD_NAME=Lead $owner_national" lead-detail.yaml
# The won lead's project: the board lists it under Won, its page moves it on and back and marks a
# row not needed, and its handover then names only the rows still waiting.
project=(-e "PROJECT_ID=$project_id" -e "PROJECT_NAME=Won $owner_national")
flow "${project[@]}" projects-board.yaml
flow "${project[@]}" -e "REASON=Signed on paper" project-detail.yaml
flow "${project[@]}" project-handover.yaml
# Its payments: the first part due at Won, and Collect with no UPI ID or bank set yet.
flow "${project[@]}" project-payments.yaml
# The company's two records for one family merge last: the other flows read them as they stand.
from_survivor="$(node ../support/mobile-cli.ts merge-from "Lead $owner_national")"
pair=(-e "SURVIVOR_ID=$survivor_id" -e "LOSER_ID=$loser_id" -e "SURVIVOR_NAME=Lead $owner_national")
flow "${pair[@]}" -e "SURVIVOR_CITY=Pune" -e "FROM_SURVIVOR=$from_survivor" customer-merge.yaml
echo "mobile suite PASS on $device"
