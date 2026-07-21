#!/usr/bin/env bash
# 数据库备份脚本
# 用法：./scripts/backup.sh [output_dir]
set -euo pipefail

OUTPUT_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${OUTPUT_DIR}/plms_${TIMESTAMP}.sql.gz"

mkdir -p "$OUTPUT_DIR"

echo "📦 备份 PostgreSQL → ${BACKUP_FILE}"

# 从 docker compose 容器中执行 pg_dump
docker compose exec -T postgres pg_dump \
  -U "${DB_USER:-plms}" \
  -d "${DB_NAME:-plms}" \
  --no-owner --clean --if-exists \
  | gzip > "$BACKUP_FILE"

echo "✅ 备份完成: $(du -h "$BACKUP_FILE" | cut -f1)"

# 保留最近 7 天的备份
find "$OUTPUT_DIR" -name "plms_*.sql.gz" -mtime +7 -delete
echo "🧹 清理 7 天前的旧备份"
