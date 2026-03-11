# SSL Certificate Pinning

We pin the **Let's Encrypt E7 intermediate CA** (not the leaf cert).

- **Valid until:** March 12, 2027
- **Why intermediate?** The leaf cert renews every 90 days automatically. The intermediate is stable for years. No app update needed on routine cert renewal.
- **When to update:** Only if Let's Encrypt rotates the E7 intermediate (they announce this months in advance).

## How to obtain / refresh the cert

```bash
# Extract the intermediate cert (cert #2 in the chain)
openssl s_client -connect api.thulobazaar.com.np:443 -showcerts </dev/null 2>/dev/null \
  | awk 'BEGIN{c=0} /BEGIN CERTIFICATE/{c++} c==2{print} /END CERTIFICATE/ && c==2{exit}' \
  > apps/mobile/assets/certs/api_thulobazaar.pem

# Verify it's the intermediate (should show "Let's Encrypt E7")
openssl x509 -in apps/mobile/assets/certs/api_thulobazaar.pem -noout -subject -dates
```

## Important notes

- **Development:** Pinning is silently skipped if the file is missing — dev builds unaffected.
- **Never commit private keys** here — only the public certificate (.pem).
- **Next action needed:** Around February 2027, run the command above and ship a new release.
