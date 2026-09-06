#!/usr/bin/env bash
# Certificate rotation, rehearsed rather than described.
#
# Rotation is three steps and the middle one is the whole point:
#   1  TRUST BOTH    — server's clientCaFiles is the bundle; old and new clients both work
#   2  ROTATE THE SERVER'S OWN CERTIFICATE to the new CA
#   3  MOVE CLIENTS   — every service gets a certificate from the new CA
#   4  DROP THE OLD   — the bundle becomes the new CA alone; old certificates stop working
#
# Step 2 is the one that gets forgotten, and forgetting it does not fail quietly: the server
# verifies its OWN certificate on the internode path, so dropping the old CA while the server
# still presents an old-CA certificate takes the CLUSTER down — every client is refused,
# including ones already holding new-CA certificates: run this drill without step 2 and a
# new-CA client is refused alongside the old one.
#
# Skipping step 1 is an outage. Never doing step 4 means the CA you rotated away from is still
# trusted, which is the failure rotation existed to fix. Every half is checked here.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

COMPOSE="docker compose -f ../compose.yaml"
fails=0
check () { if [ "$2" = 0 ]; then printf 'PASS  %-52s %s\n' "$1" "$3"
           else printf 'FAIL  %-52s %s\n' "$1" "$3"; fails=$((fails + 1)); fi }

# reach <client-cert-dir> → prints SERVING when the identity is accepted end to end
reach () {
  $COMPOSE exec -T admin temporal operator cluster health --address temporal:7233 --tls \
    --tls-ca-path /etc/temporal/pki/ca-bundle.pem \
    --tls-cert-path "/etc/temporal/pki/$1/tls.pem" \
    --tls-key-path "/etc/temporal/pki/$1/tls.key" --tls-server-name temporal \
    --grpc-meta "authorization=$(node scripts/mint-token.mjs operator)" 2>&1
}
wait_serving () { for _ in $(seq 1 60); do reach client-next | grep -q SERVING && return 0; sleep 2; done; return 1; }

echo "════ step 1 · overlap — both CAs trusted ════"
reach client-operator | grep -q SERVING; check "a certificate from the OLD CA is accepted" $? ""
reach client-next     | grep -q SERVING; check "a certificate from the NEW CA is accepted" $? ""

echo
echo "════ step 2 · rotate the SERVER's own certificate ════"
cp pki/server/tls.pem pki/server/tls.pem.old
cp pki/server/tls.key pki/server/tls.key.old
cp pki/server-next/tls.pem pki/server/tls.pem
cp pki/server-next/tls.key pki/server/tls.key
$COMPOSE restart temporal >/dev/null 2>&1
wait_serving; check "cluster serves with a NEW-CA server certificate" $? ""
reach client-operator | grep -q SERVING; check "old-CA clients still work during the overlap" $? ""

echo
echo "════ step 4 · drop the old CA ════"
cp pki/ca-bundle.pem pki/ca-bundle.pem.overlap
cp pki/ca-next/ca.pem pki/ca-bundle.pem          # new CA only
$COMPOSE restart temporal >/dev/null 2>&1
wait_serving; check "the cluster serves with only the NEW CA trusted" $? ""
reach client-next | grep -q SERVING; check "the rotated-IN certificate still works" $? ""
out="$(reach client-operator)"
echo "$out" | grep -q SERVING && old_still_works=0 || old_still_works=1
[ "$old_still_works" = 1 ]; check "the rotated-OUT certificate is now REFUSED" $? \
  "$(echo "$out" | head -1 | cut -c1-70)"

echo
echo "════ restore the starting state so the stack is left as found ════"
cp pki/ca-bundle.pem.overlap pki/ca-bundle.pem
mv pki/server/tls.pem.old pki/server/tls.pem
mv pki/server/tls.key.old pki/server/tls.key
rm -f pki/ca-bundle.pem.overlap
$COMPOSE restart temporal >/dev/null 2>&1
wait_serving; check "both CAs trusted again" $? ""
reach client-operator | grep -q SERVING; check "the original identity works again" $? ""

echo
[ "$fails" = 0 ] && echo "rotation rehearsal passed" || echo "$fails rotation check(s) FAILED"
exit "$fails"
