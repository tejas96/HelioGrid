#!/usr/bin/env bash
# Proves the two halves of the identity model, and that they are DIFFERENT halves.
#
# The claim being tested is the one the roadmap makes: "Do not treat certificate
# authentication as authorization." A stack where every holder of a valid certificate can do
# everything looks identical to a correct one in every log until the day it does not.
#
#   bash infra/temporal/scripts/probe-identity.sh
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

COMPOSE="docker compose -f compose.yaml"
NS=heliogrid
PKI=/etc/temporal/pki
fails=0

# run <cert-dir> <token-identity|none> <args...>
run () {
  local cert="$1" ident="$2"; shift 2
  # `${auth[@]+...}` and not `"${auth[@]}"`: under `set -u`, bash 3.2 (what macOS ships)
  # treats an EMPTY array expansion as an unbound variable and aborts the function. The
  # no-token probe is exactly the case that hits it, so the bug silently turned the most
  # important assertion in this file into a pass. Found 2026-08-25 by reading the output
  # rather than the exit code.
  local auth=()
  if [ "$ident" != "none" ]; then
    auth=(--grpc-meta "authorization=$(node scripts/mint-token.mjs "$ident")")
  fi
  $COMPOSE exec -T admin temporal "$@" \
    --address temporal:7233 \
    --tls --tls-ca-path "$PKI/ca-bundle.pem" \
    --tls-cert-path "$PKI/$cert/tls.pem" --tls-key-path "$PKI/$cert/tls.key" \
    --tls-server-name temporal \
    ${auth[@]+"${auth[@]}"} 2>&1
}

expect () { # expect <allow|deny> <label> <output>
  local want="$1" label="$2" out="$3" got
  if echo "$out" | grep -qiE "unauthorized|permission denied|access denied"; then got=deny
  # Under TLS 1.3 the server evaluates the CLIENT certificate AFTER the handshake completes,
  # so a rejected client sees a finished handshake and then a dropped connection — `openssl
  # s_client` even reports "Verify return code: 0 (ok)" for a certificate the server will
  # refuse. "The handshake succeeded" is therefore not evidence of trust; the connection dying
  # before any RPC completes is. Checked 2026-08-25 against both a trusted and a rogue cert.
  elif echo "$out" | grep -qiE "tls|certificate|handshake|transport: authentication|broken pipe|connection reset|EOF|failed reaching server"; then got=tls-refused
  elif [ -z "$out" ] || ! echo "$out" | grep -qiE "^error|level=ERROR"; then got=allow
  else got=error; fi
  if [ "$got" = "$want" ]; then
    printf 'PASS  %-58s %s\n' "$label" "$got"
  else
    printf 'FAIL  %-58s want=%s got=%s\n      %s\n' "$label" "$want" "$got" "$(echo "$out" | head -1 | cut -c1-140)"
    fails=$((fails + 1))
  fi
}

echo "════ transport identity — mutual TLS ════"
expect allow       "trusted cert (api) + valid token reaches the server" \
  "$(run client-api api operator cluster health)"
rogue_out="$(run client-rogue operator operator cluster health)"
expect tls-refused "cert from an UNTRUSTED CA cannot complete an RPC" "$rogue_out"
# The assertion that does not depend on error-text matching: it never got an answer.
if echo "$rogue_out" | grep -q "SERVING"; then
  printf 'FAIL  %-58s IT WAS SERVED — the client CA is not being checked\n' "untrusted CA gets no cluster answer"
  fails=$((fails + 1))
else
  printf 'PASS  %-58s no answer\n' "untrusted CA gets no cluster answer"
fi
expect allow       "cert from the NEXT CA is accepted — rotation overlap is open" \
  "$(run client-next operator operator cluster health)"

echo
echo "════ authorization — a certificate is not a permission ════"
expect deny  "valid cert, NO token: refused (the headline claim)" \
  "$(run client-api none operator namespace describe --namespace $NS)"
expect allow "api token may read its namespace" \
  "$(run client-api api operator namespace describe --namespace $NS)"
expect deny  "api token may NOT administer the cluster (register a namespace)" \
  "$(run client-api api operator namespace create --namespace probe-should-not-exist --retention 1d)"
expect allow "operator token may administer the cluster" \
  "$(run client-operator operator operator namespace describe --namespace $NS)"
expect deny  "reader token may NOT start a workflow (read is not write)" \
  "$(run client-api reader workflow start --type ProbeWorkflow --task-queue probe --workflow-id probe-reader-$$ --namespace $NS)"

echo
echo "════ did the refused namespace actually not get created? ════"
out="$(run client-operator operator operator namespace describe --namespace probe-should-not-exist)"
if echo "$out" | grep -qiE "not found|does not exist|NamespaceNotFound"; then
  printf 'PASS  %-58s absent\n' "the namespace the api identity was refused"
else
  printf 'FAIL  %-58s IT EXISTS — the denial did not hold\n' "the namespace the api identity was refused"
  fails=$((fails + 1))
fi

echo
[ "$fails" = 0 ] && echo "all identity probes passed" || echo "$fails identity probe(s) FAILED"
exit "$fails"
