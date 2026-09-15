# Graviton (arm64) Migration Plan — EC2 t3a.medium → t4g.medium

Status: **CUT OVER 2026-09-15 18:30 UTC.** Production = `i-0499c38cf408d1eff` (t4g.medium, arm64) behind the EIP.
Downtime 2 min. Old `i-07cffd6ca1fd4468e` left RUNNING (web/api stopped, public IP 13.200.207.15) as
rollback until ~2026-09-22, then Phase 3/4 cleanup. Written 2026-09-15.

**Rollback (while old box exists):** `aws ec2 associate-address --region ap-south-1 --allocation-id eipalloc-0b1f1f10166d111c1 --instance-id i-07cffd6ca1fd4468e --allow-reassociation`
then on old: `docker compose -f docker-compose.prod.yml start web api`. Data written after cutover would be lost — dump the new box first.

**Found during rehearsal:** repo compose lacked nginx `443:443` + `./ssl` mount (fixed in 871a70cf).

## Honest numbers first

| | t3a.medium (now) | t4g.medium (target) |
|---|---|---|
| CPU | 2 vCPU AMD x86_64 | 2 vCPU Graviton2 arm64 |
| RAM | 4 GB | 4 GB |
| On-demand, ap-south-1 | $0.0246/h ≈ **$18.0/mo** | $0.0224/h ≈ **$16.4/mo** |
| Saving | | **≈ $1.60/mo (9%)** |

Graviton2 also benchmarks faster than the AMD t3a at the same size, so it is
"slightly cheaper AND a bit faster", but the money saving is small. The reason
to do it is consistency with the Apple-Silicon dev machine + free perf, not cost.
There is NO end-of-life pressure on x86 EC2 — this is optional.

## Current state (verified 2026-09-15)

- Instance `i-07cffd6ca1fd4468e`, `t3a.medium`, `ap-south-1c`, AMI Ubuntu 24.04 amd64, credits `unlimited`, no IAM role
- **Elastic IP** `52.66.73.213` (`eipalloc-0b1f1f10166d111c1`) → cutover = re-associate EIP, no DNS change
- Behind **Cloudflare** (origin cert in `/etc/nginx/ssl/` on host) → Cloudflare never sees the swap
- 1 × 30 GB gp3 volume; SG `sg-0628b345587d2887c`; key `thulobazaar-key`
- Stack: nginx, web (Next 16), api (Express), postgres:16-alpine, typesense:0.25.2
- Host: Ubuntu 24.04, Docker 29.2.1, Compose v5.1.0, disk 17G/29G used
- Data volumes (2026-09-15): `thulobazaar_postgres-data` 146M, `thulobazaar_typesense-data` 54M, `thulobazaar_uploads-data` 1.1G
- Host files: `/opt/thulobazaar/{.env (41 keys), firebase-service-account.json, docker-compose.prod.yml, nginx/nginx.conf, backup-db.sh, ssl/ (root-owned, Cloudflare origin cert)}`, `~/.aws/{config,credentials}`
- Crons: `/etc/cron.daily/db-backup-s3`, `/etc/cron.monthly/purge-deleted-ad-images`, ubuntu crontab `0 */6 * * * /opt/thulobazaar/backup-db.sh`
- Nightly DB dump already goes to `s3://thulobazaar-db-backups-143684032601/nightly/`
- CI: `.github/workflows/ci.yml` builds on `ubuntu-latest` (x86), pushes `thulobazaar-web` / `thulobazaar-api` to ECR, SSHes to EC2 to pull

## arm64 compatibility (all verified)

| Component | arm64? | Note |
|---|---|---|
| `node:20-alpine`, `postgres:16-alpine`, `nginx:alpine` | ✅ | official multi-arch |
| `typesense/typesense:0.25.2` | ✅ | manifest has amd64 + arm64 |
| Prisma | ✅ | `prisma generate` runs inside the image → picks `linux-musl-arm64-openssl-3.0.x` itself |
| sharp 0.34.5 / libvips 1.2.4 | ✅ | `@img/sharp-linuxmusl-arm64@0.34.5`, `@img/sharp-libvips-linuxmusl-arm64@1.2.4` exist on npm |
| Next SWC, lightningcss, tailwind oxide, unrs resolver | ✅ | `*-linux-arm64-musl` variants exist |
| GitHub Actions arm runner `ubuntu-24.04-arm` | ✅ | GA for private repos since 2026-01-29, $0.005/min |

**The only code change** is in both Dockerfiles: the `npm install --no-save` block
hardcodes `*-linux-x64-musl`. It must switch on Docker's built-in `TARGETARCH`.

## Strategy: blue/green with multi-arch images

Build images for BOTH architectures under the same tag. The old x86 box keeps
pulling amd64, the new Graviton box pulls arm64. Rollback at every step is
"point the EIP back". Nothing is destroyed until the end.

```
Phase 0  CI builds multi-arch  ──▶  prod unchanged (still amd64)      rollback: revert commit
Phase 1  launch t4g, rehearse   ──▶  prod unchanged                    rollback: terminate t4g
Phase 2  cutover (~10 min)      ──▶  EIP → t4g                          rollback: EIP → t3a
Phase 3  soak 7 days            ──▶  old t3a STOPPED, not terminated
Phase 4  cleanup                ──▶  terminate t3a, drop amd64 from CI
```

---

## Phase 0 — CI + Dockerfiles (no prod impact)

**0.1 Dockerfiles** (`apps/web/Dockerfile`, `apps/api/Dockerfile`)
```dockerfile
ARG TARGETARCH                       # docker sets amd64 | arm64
RUN NODEARCH=$([ "$TARGETARCH" = "arm64" ] && echo arm64 || echo x64) && \
    npm install --no-save \
      @next/swc-linux-${NODEARCH}-musl \
      lightningcss-linux-${NODEARCH}-musl \
      @tailwindcss/oxide-linux-${NODEARCH}-musl \
      @unrs/resolver-binding-linux-${NODEARCH}-musl \
      @img/sharp-linuxmusl-${NODEARCH}@0.34.5 \
      @img/sharp-libvips-linuxmusl-${NODEARCH}@1.2.4
```
Verify locally on the M3 (native arm64, fast):
`docker build -f apps/api/Dockerfile -t tb-api:arm .` then
`docker run --rm tb-api:arm node -e "require('sharp'); console.log('sharp ok')"`.
And `docker build --platform linux/amd64 ...` still works (emulated, slow but proves amd64 path).

**0.2 ci.yml** — replace the two `docker build` steps with a matrix:
- `ubuntu-latest` builds `:<sha>-amd64`, `ubuntu-24.04-arm` builds `:<sha>-arm64`
- then `docker buildx imagetools create -t :<sha> -t :latest :<sha>-amd64 :<sha>-arm64`
  (creates the manifest list; existing EC2 pull step needs no change)
- Cost: arm job ≈ same minutes as today's x86 job, at $0.005/min. Check plan quota first.
- Native arm runner, NOT QEMU: a Next build under QEMU takes 30–60 min.

**0.3 Deploy Phase 0** to the existing x86 box. It pulls amd64 from the manifest.
Verify: `docker image inspect --format '{{.Architecture}}' <web image>` on EC2 = `amd64`, site healthy.
This is the checkpoint: multi-arch is live with zero behaviour change.

## Phase 1 — Launch + rehearse (no prod impact)

**1.1 Launch** (console or admin CLI — `thulobazaar-deploy` IAM has NO EC2 launch perms):
- `t4g.medium`, AMI **Ubuntu 24.04 arm64** (`ubuntu-noble-24.04-arm64-server-*`), same subnet `subnet-0c601a9fa0b3eb530`, same SG, key `thulobazaar-key`, **40 GB** gp3 (30 GB has filled up before), credits `unlimited`
- Tag `Name=thulobazaar-graviton`

**1.2 Provision** (mirror old host):
```
apt update && apt install -y docker.io docker-compose-v2 awscli rsync
usermod -aG docker ubuntu
mkdir -p /opt/thulobazaar && chown ubuntu /opt/thulobazaar
```
Copy from old host (over scp/rsync via your Mac, or old→new directly):
`/opt/thulobazaar/{.env,firebase-service-account.json,docker-compose.prod.yml,nginx/}`,
`/etc/nginx/ssl/` (or wherever `origin.pem/key` live — check compose mount on the real host),
`~/.aws/{credentials,config}`, `/etc/cron.daily/db-backup-s3`, `/etc/cron.monthly/purge-deleted-ad-images`,
`/opt/thulobazaar/db-backups/` scripts.

**1.3 Seed data from backup (not from live):**
- `aws s3 cp s3://thulobazaar-db-backups-143684032601/nightly/<latest>.dump .` → `pg_restore` into new postgres container
- `rsync -a` old `uploads-data` volume → new (initial full copy; final incremental at cutover)
- `rsync -a` old `typesense-data` volume → new (RocksDB, arch-independent)

**1.4 Bring up + test through Cloudflare's eyes:**
```
docker compose -f docker-compose.prod.yml pull && up -d
# from Mac, hit the new box directly with the real Host header:
curl -sk --resolve thulobazaar.com.np:443:<NEW_PUBLIC_IP> https://thulobazaar.com.np/ | head
curl -sk --resolve api.thulobazaar.com.np:443:<NEW_PUBLIC_IP> https://api.thulobazaar.com.np/api/health
```
Checklist: homepage 200, ad page with image renders (sharp/uploads), search returns
results (typesense), login works (NextAuth), post-ad image upload works (sharp arm64 write path),
`docker image inspect` shows `arm64`, `docker stats` memory sane.

## Phase 2 — Cutover (target ≤10 min downtime, off-peak Nepal time ≈ 02:00–05:00 NPT)

```
# OLD box — freeze writes
docker compose -f docker-compose.prod.yml stop web api      # nginx stays → 502 for ~10 min
docker compose exec -T postgres pg_dump -U <u> -Fc thulobazaar > /tmp/final.dump

# transfer + restore on NEW (drop & recreate DB first so it's an exact copy)
rsync final.dump, then: pg_restore --clean --if-exists -d thulobazaar final.dump
rsync -a --delete uploads-data → new          # incremental, seconds
rsync -a --delete typesense-data → new        # api/web stopped, index is quiescent

# NEW box
docker compose -f docker-compose.prod.yml up -d
# smoke test via --resolve as in 1.4

# SWAP
aws ec2 associate-address --region ap-south-1 \
  --allocation-id eipalloc-0b1f1f10166d111c1 --instance-id <NEW_ID> --allow-reassociation

# verify through Cloudflare (real path)
curl -s https://thulobazaar.com.np/ -o /dev/null -w '%{http_code}\n'
curl -s https://api.thulobazaar.com.np/api/health
```
Then: post a test ad from the Flutter app + web, search for it, delete it.

**Rollback (any time in Phase 2/3):**
`associate-address ... --instance-id i-07cffd6ca1fd4468e` + `docker compose start web api` on old.
Data written to the new box after cutover would be lost on rollback — so rollback only in the first hour, or take a dump first.

**Nothing in GitHub changes**: `EC2_HOST` secret is the EIP (unchanged), `EC2_SSH_KEY` is the same key. The next push deploys to the new box automatically.

## Phase 3 — Soak (7 days)

- `aws ec2 stop-instances --instance-ids i-07cffd6ca1fd4468e` (stopped = only EBS billed, ≈ $2.4/mo)
- Watch: nightly S3 backup log on new host, uploads purge cron, memory (`free -m`), disk, Cloudflare 5xx graph, Play/App Store crash reports
- Do at least one normal CI deploy to prove the pipeline

## Phase 4 — Cleanup

- Snapshot then terminate old instance; delete its volume
- Drop the amd64 matrix leg from ci.yml (halves CI minutes) — or keep multi-arch if you want a
  permanent x86 escape hatch
- Update memories: `manual_web_deploy` (`--platform linux/arm64` now, native on the M3, no emulation),
  `deployment`, CLAUDE.md production section (instance id, arch)

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| SSH to prod blocked from current network (timed out 2026-09-15; SG allows 0.0.0.0/0 → ISP/VPN blocks port 22) | Must fix BEFORE Phase 1: try mobile hotspot / other network; or enable EC2 Instance Connect from console |
| sharp arm64 binary mismatch | pinned versions; verified on M3 in 0.1 before any CI change |
| CI arm minutes exceed plan quota | check Settings → Billing → Actions before 0.2; fall back to a self-hosted build on the M3 (`docker buildx build --platform linux/arm64 --push`) |
| Postgres restore misses data | `pg_dump` taken AFTER api/web stopped; compare `SELECT count(*)` on ads/users/messages old vs new before EIP swap |
| Typesense index corrupt after copy | search smoke test in 1.4/2; fallback = rebuild via `bulkIndexAds` (`apps/web/src/lib/search/typesense.ts:121`) — no CLI wrapper exists yet |
| Missed host-level file (cron, cert, credentials) | `find / -newer /etc/hostname -path '*thulobazaar*'` + `crontab -l`, `ls /etc/cron.*` on old host before 1.2 |
| Disk fills with images (has happened) | 40 GB volume + keep the `docker image prune` step already in ci.yml |

## Decisions (2026-09-15)

1. **SSH** — was blocked by Urban VPN Desktop (blocks port 22 to every host). Disconnect it before any prod work: `scutil --nc stop "Urban VPN Desktop"`.
2. **Instance launch** — owner does it in the AWS console (root/admin); steps in Phase 1.1.
3. **CI minutes** — repo is PUBLIC → `ubuntu-24.04-arm` is free. Verified nothing private is tracked (keystore/.pem/.env/key.properties all gitignored).
4. **Window** — tonight (2026-09-15/16), after Phase 0 is verified on the old box.
5. **Keep multi-arch** after cutover (x86 escape hatch).

## Sources

- Pricing: [t4g.medium ap-south-1](https://www.economize.cloud/resources/aws/pricing/ec2/t4g.medium/), [t3a.medium ap-south-1](https://www.economize.cloud/resources/aws/pricing/ec2/t3a.medium/), [Vantage t3a.medium](https://instances.vantage.sh/aws/ec2/t3a.medium?region=ap-south-1&os=linux&cost_duration=monthly&reserved_term=Standard.noUpfront&currency=USD)
- Arm CI: [arm64 standard runners in private repos (GitHub changelog 2026-01-29)](https://github.blog/changelog/2026-01-29-arm64-standard-runners-are-now-available-in-private-repositories/), [GitHub Actions pricing 2026](https://cicdpipelinecost.com/github-actions-pricing)
- Typesense arm64: [Docker distribution thread](https://threads.typesense.org/t/docker-distribution-of-typesense-on-different-platforms/2K339c), [typesense/typesense tags](https://hub.docker.com/r/typesense/typesense/tags)
- Graviton guidance: [AWS Graviton transition guide](https://aws.github.io/graviton/transition-guide.html), [aws-graviton-getting-started/containers.md](https://github.com/aws/aws-graviton-getting-started/blob/main/containers.md), [Multi-arch Node builds: Apple Silicon → Graviton](https://dev.to/raju_dandigam/multi-architecture-docker-builds-for-nodejs-from-apple-silicon-to-aws-graviton-34dn), [Prisma on Graviton (#13073)](https://github.com/prisma/prisma/issues/13073)
