#!/bin/sh
# =============================================================
#  backup.sh — Postgres dump and upload to AWS S3
# =============================================================
set -e

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="/tmp/backups"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

mkdir -p "$BACKUP_DIR"

# ── 1. Dump main database ─────────────────────────────────────
echo "📦 Dumping $POSTGRES_DB..."
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h postgres \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -F c \
  -f "$BACKUP_DIR/main_${TIMESTAMP}.dump"

# ── 2. Dump Umami database ────────────────────────────────────
echo "📦 Dumping $UMAMI_DB..."
PGPASSWORD="$UMAMI_POSTGRES_PASSWORD" pg_dump \
  -h umami-db \
  -U "$UMAMI_POSTGRES_USER" \
  -d "$UMAMI_DB" \
  -F c \
  -f "$BACKUP_DIR/umami_${TIMESTAMP}.dump"

# ── 3. Compress ───────────────────────────────────────────────
ARCHIVE="$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz"
tar -czf "$ARCHIVE" -C "$BACKUP_DIR" \
  "main_${TIMESTAMP}.dump" \
  "umami_${TIMESTAMP}.dump"

echo "🗜  Archive: $ARCHIVE ($(du -sh $ARCHIVE | cut -f1))"

# ── 4. Upload to AWS S3 ───────────────────────────────────────
echo "☁️  Uploading to S3: s3://${AWS_S3_BUCKET}/$(basename $ARCHIVE)"

aws s3 cp "$ARCHIVE" "s3://${AWS_S3_BUCKET}/$(basename $ARCHIVE)" \
  --region "$AWS_DEFAULT_REGION" \
  --storage-class STANDARD_IA   # ~46% cheaper than Standard for backups

echo "✅ Upload complete!"

# ── 5. Remove old backups from S3 ────────────────────────────
echo "🧹 Removing backups older than $RETENTION_DAYS days..."
CUTOFF=$(date -d "-${RETENTION_DAYS} days" +"%Y-%m-%dT%H:%M:%S")

aws s3api list-objects-v2 \
  --bucket "$AWS_S3_BUCKET" \
  --query "Contents[?LastModified<='${CUTOFF}'].Key" \
  --output text | tr '\t' '\n' | while read -r key; do
    [ -z "$key" ] && continue
    echo "   Removing: $key"
    aws s3 rm "s3://${AWS_S3_BUCKET}/$key"
done

# ── 6. List existing backups on S3 ───────────────────────────
echo ""
echo "📋 Backups on S3:"
aws s3 ls "s3://${AWS_S3_BUCKET}/" --human-readable

# ── 7. Clean up temp files ────────────────────────────────────
rm -rf "$BACKUP_DIR"

echo ""
echo "🎉 Backup completed at $(date)"