#!/bin/bash

# Generate SSL certificates for local HTTPS development
# This creates self-signed certificates for localhost

SSL_DIR="$(dirname "$0")/ssl"
mkdir -p "$SSL_DIR"

echo "🔐 Generating SSL certificates for localhost development..."

# Generate private key
openssl genrsa -out "$SSL_DIR/localhost-key.pem" 2048

# Generate certificate signing request
openssl req -new -key "$SSL_DIR/localhost-key.pem" -out "$SSL_DIR/localhost.csr" \
  -subj "/C=US/ST=CA/L=San Francisco/O=Witchcraftery/OU=Development/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -in "$SSL_DIR/localhost.csr" -signkey "$SSL_DIR/localhost-key.pem" \
  -out "$SSL_DIR/localhost-cert.pem" -days 365 \
  -extensions v3_req -extfile <(
cat <<EOF
[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
)

# Clean up CSR file
rm "$SSL_DIR/localhost.csr"

# Set appropriate permissions
chmod 600 "$SSL_DIR/localhost-key.pem"
chmod 644 "$SSL_DIR/localhost-cert.pem"

echo "✅ SSL certificates generated successfully!"
echo "📁 Location: $SSL_DIR"
echo "🔐 Key: localhost-key.pem"
echo "📜 Certificate: localhost-cert.pem"
echo ""
echo "⚠️  Note: You may need to add the certificate to your system's trusted certificates"
echo "   or accept the browser security warning for localhost development."
