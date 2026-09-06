#!/usr/bin/env bash
# Development PKI for the local Temporal stack. DEVELOPMENT ONLY.
#
# It mints, into infra/temporal/pki/ (gitignored, never committed):
#   ca/            the current development CA
#   ca-next/       a SECOND CA, so certificate rotation can be rehearsed with an overlap
#                  window rather than described. Rotation is the drill that always fails in
#                  production because nobody ran it while both CAs were trusted at once.
#   server/        the frontend's certificate — SANs matter: the client verifies the server
#                  name, so a missing SAN is the failure this file exists to prevent
#   client-api/    the API's identity
#   client-worker/ the worker's identity
#   client-operator/ the operator's identity
#   client-rogue/  signed by an UNTRUSTED CA — proves the trust chain is actually checked
#   client-next/   signed by ca-next — proves the overlap window works
#   jwt/           an RS256 keypair and its JWKS, because mTLS proves WHO, not WHAT-MAY.
#
# Certificate authentication is NOT authorization. That is the whole reason the JWT material
# is here beside the certificates: a valid certificate with an insufficient token must be
# refused, and `probe-authorization.sh` proves it.
set -euo pipefail
cd "$(dirname "$0")/.." || exit 1

PKI="pki"
DAYS=825            # under the 825-day browser/most-toolchain ceiling; dev material only

# Clear the CONTENTS, never the directory itself. `rm -rf pki` replaces the directory inode,
# and a running container's bind mount still points at the OLD one — every certificate then
# reads as "no such file or directory" INSIDE the container while `ls` on the host shows them
# all present.
mkdir -p "$PKI"
find "$PKI" -mindepth 1 -delete
mkdir -p "$PKI"/{ca,ca-next,ca-rogue,server,server-next,client-api,client-worker,client-operator,client-rogue,client-next,jwt}

make_ca () {  # make_ca <dir> <common-name>
  openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days "$DAYS" \
    -keyout "$1/ca.key" -out "$1/ca.pem" \
    -subj "/O=HelioGrid Development/CN=$2" >/dev/null 2>&1
}

# <dir> <cn> <ca-dir> [extra-SANs]
make_cert () {
  local dir="$1" cn="$2" ca="$3" san="${4:-}"
  openssl req -newkey rsa:2048 -nodes -sha256 \
    -keyout "$dir/tls.key" -out "$dir/tls.csr" \
    -subj "/O=HelioGrid Development/CN=$cn" >/dev/null 2>&1
  {
    echo "basicConstraints=CA:FALSE"
    echo "keyUsage=digitalSignature,keyEncipherment"
    if [ -n "$san" ]; then
      echo "extendedKeyUsage=serverAuth,clientAuth"
      echo "subjectAltName=$san"
    else
      echo "extendedKeyUsage=clientAuth"
    fi
  } > "$dir/ext.cnf"
  openssl x509 -req -in "$dir/tls.csr" -CA "$ca/ca.pem" -CAkey "$ca/ca.key" \
    -CAcreateserial -days "$DAYS" -sha256 -extfile "$dir/ext.cnf" \
    -out "$dir/tls.pem" >/dev/null 2>&1
  rm -f "$dir/tls.csr" "$dir/ext.cnf"
}

make_ca "$PKI/ca"       "HelioGrid Development CA"
make_ca "$PKI/ca-next"  "HelioGrid Development CA (next)"
make_ca "$PKI/ca-rogue" "Untrusted CA"

# The server is reached as `temporal` inside the compose network and as `localhost` from the
# host. Both names must be SANs or the client's server-name verification fails — and it
# should fail, which is exactly why the rogue client below exists to prove the check is on.
make_cert "$PKI/server" "temporal" "$PKI/ca" "DNS:temporal,DNS:localhost,IP:127.0.0.1"
# The SAME server identity, signed by the NEXT CA. Rotation needs it, and the reason is easy
# to miss: the server verifies its OWN certificate on the internode path, so dropping the old
# CA from the trust bundle while the server still presents an old-CA certificate breaks the
# cluster internally — every client is refused, including ones holding new-CA certificates.
make_cert "$PKI/server-next" "temporal" "$PKI/ca-next" "DNS:temporal,DNS:localhost,IP:127.0.0.1"

make_cert "$PKI/client-api"      "api"      "$PKI/ca"
make_cert "$PKI/client-worker"   "worker"   "$PKI/ca"
make_cert "$PKI/client-operator" "operator" "$PKI/ca"
make_cert "$PKI/client-next"     "api"      "$PKI/ca-next"
make_cert "$PKI/client-rogue"    "api"      "$PKI/ca-rogue"

# Both CAs concatenated: what the server trusts DURING a rotation overlap. Rotation is
# 1) trust both, 2) move clients, 3) drop the old — and step 1 is this file.
cat "$PKI/ca/ca.pem" "$PKI/ca-next/ca.pem" > "$PKI/ca-bundle.pem"

# ── JWT material ────────────────────────────────────────────────────────────────────
# RS256, because Temporal's default key provider fetches a JWKS over HTTP and verifies
# asymmetrically — a shared secret would put the signing key on every client.
openssl genrsa -out "$PKI/jwt/private.pem" 2048 >/dev/null 2>&1
openssl rsa -in "$PKI/jwt/private.pem" -pubout -out "$PKI/jwt/public.pem" >/dev/null 2>&1
node scripts/make-jwks.mjs "$PKI/jwt/public.pem" > "$PKI/jwt/jwks.json"

chmod -R go-rwx "$PKI"
echo "development PKI written to infra/temporal/$PKI (gitignored)"
echo
echo "  CA               $(openssl x509 -in "$PKI/ca/ca.pem" -noout -subject | sed 's/^subject=//')"
echo "  server SANs      $(openssl x509 -in "$PKI/server/tls.pem" -noout -ext subjectAltName | tail -1 | xargs)"
for id in api worker operator; do
  echo "  client-$id$(printf '%*s' $((9 - ${#id})) '')CN=$(openssl x509 -in "$PKI/client-$id/tls.pem" -noout -subject | sed 's/.*CN=//')"
done
echo "  rogue client     signed by an UNTRUSTED CA (rejection probe)"
echo "  next client      signed by ca-next (rotation-overlap probe)"
