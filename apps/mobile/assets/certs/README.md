# SSL Certificate Pinning

We pin the **Let's Encrypt ROOT CAs** — `ISRG Root X1` and `ISRG Root X2` —
**not** the leaf or intermediate.

- **Valid until:** X1 → June 2035, X2 → Sept 2040
- **Why the roots?** `api.thulobazaar.com.np` is served by **Cloudflare**, whose
  edge certificate rotates automatically (~90-day Let's Encrypt) and whose
  **intermediate also changes** (it was `E7`, it is now `YE1`). Pinning a leaf or
  intermediate caused a full production outage when Cloudflare rotated — every
  `/api/*` call through the pinned client failed TLS before leaving the device.
  The roots are stable for a decade and anchor any Let's Encrypt-issued edge cert.
- **When to update:** Only if Cloudflare switches the API off Let's Encrypt to a
  different CA (e.g. Google Trust Services). If that happens, add that CA's root
  to this bundle.

## ⚠️ Do NOT re-pin a leaf or intermediate

It looks "more secure" and seems to renew fine in testing, but it hard-breaks the
app on the next Cloudflare rotation with no warning. Pin roots only.

## How to refresh / verify the bundle

```bash
# Roots come from the OS trust store (offline, trustworthy)
security find-certificate -a -c "ISRG Root X1" -p \
  /System/Library/Keychains/SystemRootCertificates.keychain  > x1.pem
security find-certificate -a -c "ISRG Root X2" -p \
  /System/Library/Keychains/SystemRootCertificates.keychain  > x2.pem
cat x1.pem x2.pem > apps/mobile/assets/certs/api_thulobazaar.pem

# Verify the LIVE chain validates against this bundle (must print "OK")
openssl s_client -connect api.thulobazaar.com.np:443 \
  -servername api.thulobazaar.com.np -showcerts </dev/null 2>/dev/null \
  | awk '/BEGIN CERT/,/END CERT/' > chain.pem
awk 'BEGIN{n=0}/BEGIN CERT/{n++}{print > ("c"n".pem")}' chain.pem
cat c2.pem c3.pem c4.pem > inter.pem
openssl verify -CAfile apps/mobile/assets/certs/api_thulobazaar.pem \
  -untrusted inter.pem c1.pem
```

## Important notes

- **Development:** Pinning is silently skipped if the file is missing — dev builds
  unaffected. See `DioClient.ensureInitialized()`.
- **Never commit private keys** here — only public root certificates (.pem).
- **Routine Cloudflare/Let's Encrypt rotation needs no app update** with root pinning.
