#!/bin/bash
# Generate self-signed TLS certificates for local staging HTTPS
#
# Usage: ./infra/scripts/generate-certs.sh
#
# This script generates a self-signed certificate valid for 365 days
# for localhost and 127.0.0.1. The certificate is placed in infra/certs/
# and is NOT committed to version control (.gitignored).
#
# For production, use a proper CA-signed certificate (e.g., Let's Encrypt).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CERT_DIR="$SCRIPT_DIR/../certs"

mkdir -p "$CERT_DIR"

echo "Generating self-signed TLS certificate for localhost..."

openssl req -x509 -newkey rsa:2048 \
  -keyout "$CERT_DIR/localhost-key.pem" \
  -out "$CERT_DIR/localhost.pem" \
  -sha256 -days 365 -nodes \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo ""
echo "Certificate generated successfully:"
echo "  Key:  $CERT_DIR/localhost-key.pem"
echo "  Cert: $CERT_DIR/localhost.pem"
echo ""
echo "These files are .gitignored and will not be committed."
echo ""
echo "To use with the backend, set these environment variables:"
echo "  SSL_KEY_PATH=$CERT_DIR/localhost-key.pem"
echo "  SSL_CERT_PATH=$CERT_DIR/localhost.pem"
echo "  COOKIE_SECURE=true"
echo ""
echo "Note: Your browser will show a security warning for self-signed certs."
echo "This is expected for local staging. Click 'Advanced' → 'Proceed' to continue."
