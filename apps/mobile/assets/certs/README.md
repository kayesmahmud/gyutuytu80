# SSL Certificate Pinning

Place the production API TLS certificate here as `api_thulobazaar.pem`.

## How to obtain the certificate

```bash
# Export the current production certificate (run once, before each cert renewal)
openssl s_client -connect api.thulobazaar.com.np:443 </dev/null 2>/dev/null \
  | openssl x509 -outform PEM \
  > apps/mobile/assets/certs/api_thulobazaar.pem
```

## Important notes

- **Cert rotation:** When the TLS certificate renews, update this file and ship a new app release BEFORE the old cert expires.
- **Development:** The pinning code gracefully skips pinning if the file is missing — local/dev builds are unaffected.
- **Never commit private keys** here — only the public certificate (.pem).
