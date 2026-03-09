#!/bin/bash
# Thulo Bazaar Database Backup - Tiered Strategy
# Cron: 0 */6 * * * (every 6 hours)
#
# Retention:
#   Hourly  - last 24 backups (local)
#   Daily   - last 30 backups (local + S3)
#   Weekly  - last 12 backups (local + S3)

set -euo pipefail

BACKUP_DIR="/opt/thulobazaar/backups"
HOURLY_DIR="$BACKUP_DIR/hourly"
DAILY_DIR="$BACKUP_DIR/daily"
WEEKLY_DIR="$BACKUP_DIR/weekly"
S3_BUCKET="thulobazaar-db-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
HOUR=$(date +%H)
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday
LOG_FILE="$BACKUP_DIR/backup.log"

mkdir -p "$HOURLY_DIR" "$DAILY_DIR" "$WEEKLY_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# --- Hourly backup ---
HOURLY_FILE="$HOURLY_DIR/thulobazaar_${TIMESTAMP}.sql.gz"
docker exec thulobazaar-postgres pg_dump -U thulobazaar thulobazaar | gzip > "$HOURLY_FILE"

if [ $? -eq 0 ]; then
    SIZE=$(du -h "$HOURLY_FILE" | cut -f1)
    log "Hourly backup OK: $HOURLY_FILE ($SIZE)"
else
    log "HOURLY BACKUP FAILED!"
    exit 1
fi

# Keep only last 24 hourly backups
ls -t "$HOURLY_DIR"/thulobazaar_*.sql.gz 2>/dev/null | tail -n +9 | xargs -r rm

# --- Daily backup (at midnight UTC / 5:45 AM Nepal) ---
if [ "$HOUR" = "00" ]; then
    DAILY_FILE="$DAILY_DIR/thulobazaar_daily_${TIMESTAMP}.sql.gz"
    cp "$HOURLY_FILE" "$DAILY_FILE"
    log "Daily backup: $DAILY_FILE"

    # Upload to S3 if available
    if aws s3 cp "$DAILY_FILE" "s3://$S3_BUCKET/daily/$(basename "$DAILY_FILE")" 2>/dev/null; then
        log "Daily S3 upload OK"
    else
        log "Daily S3 upload skipped (no permissions or bucket)"
    fi

    # Keep only last 30 daily backups locally
    ls -t "$DAILY_DIR"/thulobazaar_daily_*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm
fi

# --- Weekly backup (Sunday midnight UTC) ---
if [ "$HOUR" = "00" ] && [ "$DAY_OF_WEEK" = "7" ]; then
    WEEKLY_FILE="$WEEKLY_DIR/thulobazaar_weekly_${TIMESTAMP}.sql.gz"
    cp "$HOURLY_FILE" "$WEEKLY_FILE"
    log "Weekly backup: $WEEKLY_FILE"

    # Upload to S3 if available
    if aws s3 cp "$WEEKLY_FILE" "s3://$S3_BUCKET/weekly/$(basename "$WEEKLY_FILE")" 2>/dev/null; then
        log "Weekly S3 upload OK"
    else
        log "Weekly S3 upload skipped (no permissions or bucket)"
    fi

    # Keep only last 12 weekly backups locally
    ls -t "$WEEKLY_DIR"/thulobazaar_weekly_*.sql.gz 2>/dev/null | tail -n +13 | xargs -r rm
fi

log "Backup cycle complete"
