# Production Checklist (Enterprise-Grade)

Items below require AWS/infrastructure setup before going live.
Tick each off as it is completed.

---

## Secrets (Critical — do before first deploy)

- [ ] Generate unique `JWT_SECRET` (≥ 32 random bytes) in production env
- [ ] Generate unique `REFRESH_TOKEN_SECRET` (different value from JWT_SECRET)
- [ ] Generate unique `SESSION_SECRET`
- [ ] Store all secrets in AWS Secrets Manager or SSM Parameter Store (not plain .env)

---

## Distributed Rate Limiting (Redis)

Current rate limiter uses in-memory storage — resets on restart and does not share
state across multiple API instances.

**Steps:**
1. Provision ElastiCache (Redis) on AWS
2. `npm install rate-limit-redis ioredis`
3. In `middleware/rateLimiter.ts`, replace in-memory store with:
   ```ts
   import { RedisStore } from 'rate-limit-redis';
   import Redis from 'ioredis';
   const redis = new Redis(process.env.REDIS_URL);
   // pass store: new RedisStore({ client: redis }) to each limiter
   ```

---

## Socket.IO Multi-Node Scaling (Redis)

Current Socket.IO uses an in-memory user map — won't work with multiple Node instances.

**Steps:**
1. `npm install @socket.io/redis-adapter ioredis`
2. In `socket/index.ts`, add:
   ```ts
   import { createAdapter } from '@socket.io/redis-adapter';
   import Redis from 'ioredis';
   const pub = new Redis(process.env.REDIS_URL);
   const sub = pub.duplicate();
   io.adapter(createAdapter(pub, sub));
   ```

---

## Structured Log Forwarding (CloudWatch)

Winston is already outputting JSON in production.
Wire the CloudWatch transport when the ECS/EC2 service is ready:

1. `npm install winston-cloudwatch`
2. In `lib/logger.ts`, uncomment and configure the CloudWatch transport block:
   ```ts
   import CloudWatchTransport from 'winston-cloudwatch';
   logger.add(new CloudWatchTransport({
     logGroupName: '/thulobazaar/api',
     logStreamName: process.env.ECS_TASK_ID || 'api',
     awsRegion: process.env.AWS_REGION || 'ap-south-1',
   }));
   ```
3. Ensure the ECS task role has `logs:CreateLogGroup`, `logs:PutLogEvents` permissions

---

## Database (RDS)

- [ ] Deploy PostgreSQL on RDS Multi-AZ (automatic failover)
- [ ] Enable automated backups (7-day retention minimum)
- [ ] Add a read replica for reporting/search queries
- [ ] Set `DATABASE_URL` to point to RDS writer endpoint
- [ ] Set `DATABASE_READ_URL` for read replica (update Prisma config if needed)

## Connection Pooling (PgBouncer / Prisma Accelerate)

Node.js + serverless/ECS can exhaust DB connections quickly.
Current pool: max 20 (production). Under sustained load this is not enough.

Options:
- **PgBouncer** (self-hosted): transaction-mode pooling in front of RDS
- **Prisma Accelerate** (managed): drop-in `DATABASE_URL` replacement

---

## Mobile — Release Build Obfuscation

Ensure Flutter release builds are obfuscated:
```bash
flutter build apk --release --obfuscate --split-debug-info=build/debug-symbols/
flutter build ipa --release --obfuscate --split-debug-info=build/debug-symbols/
```
Upload the `debug-symbols/` directory to Firebase Crashlytics for crash decoding.

## Mobile — SSL Certificate Pinning

See audit recommendation: implement certificate pinning in `apps/mobile/lib/core/api/dio_client.dart`
to prevent MITM attacks. This is required for enterprise security audits.
Use `dio`'s `SecurityContext` or the `ssl_pinning_plugin` package.

---

## Next Steps (Web Frontend)

These are tracked separately but also pending before production:
- Add CSP + security headers to `apps/web/next.config.ts`
- Remove `bcryptjs` duplicate from `apps/web/package.json`
- Set `debug: false` in `apps/web/src/lib/auth/authOptions.ts` (currently `true`)
