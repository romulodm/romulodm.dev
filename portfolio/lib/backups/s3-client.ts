// portfolio/lib/backups/s3-client.ts

import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cliente S3 dedicado para backups.
 *
 * Usa um bucket/prefix separado de uploads normais para:
 *   - isolar permissões IAM (policy mais restritiva)
 *   - evitar enumeração de backups via listagem pública de uploads
 */
let _client: S3Client | null = null;

export function getBackupS3(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: process.env.BACKUP_S3_REGION ?? "us-east-1",
      endpoint: process.env.BACKUP_S3_ENDPOINT, // opcional (MinIO em dev)
      credentials: {
        accessKeyId: process.env.BACKUP_S3_ACCESS_KEY!,
        secretAccessKey: process.env.BACKUP_S3_SECRET_KEY!,
      },
      forcePathStyle: Boolean(process.env.BACKUP_S3_ENDPOINT),
    });
  }
  return _client;
}

export const BACKUP_BUCKET = process.env.BACKUP_S3_BUCKET!;
export const BACKUP_PREFIX = process.env.BACKUP_S3_PREFIX ?? "postgres/";

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface BackupItem {
  key: string;          // chave completa no S3
  filename: string;     // apenas o nome do arquivo
  size: number;         // bytes
  createdAt: string;    // ISO
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Valida se a key pertence ao diretório de backups.
 * Previne Path Traversal / acesso a outras áreas do bucket.
 */
export function isValidBackupKey(key: string): boolean {
  if (typeof key !== "string") return false;
  if (key.length === 0 || key.length > 512) return false;
  if (key.includes("..") || key.includes("//")) return false;
  if (!key.startsWith(BACKUP_PREFIX)) return false;
  // Deve terminar em .dump ou .sql.gz
  return /\.(dump|sql\.gz|sql)$/i.test(key);
}

export async function listBackups(): Promise<BackupItem[]> {
  const s3 = getBackupS3();
  const result = await s3.send(
    new ListObjectsV2Command({
      Bucket: BACKUP_BUCKET,
      Prefix: BACKUP_PREFIX,
      MaxKeys: 100,
    }),
  );

  const items: BackupItem[] = (result.Contents ?? [])
    .filter((obj) => obj.Key && isValidBackupKey(obj.Key))
    .map((obj) => ({
      key: obj.Key!,
      filename: obj.Key!.slice(BACKUP_PREFIX.length),
      size: obj.Size ?? 0,
      createdAt: obj.LastModified?.toISOString() ?? new Date(0).toISOString(),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return items;
}

export async function getBackupDownloadUrl(key: string): Promise<string> {
  if (!isValidBackupKey(key)) {
    throw new Error("invalid_backup_key");
  }

  const s3 = getBackupS3();
  const cmd = new GetObjectCommand({
    Bucket: BACKUP_BUCKET,
    Key: key,
    // Force download com o nome do arquivo
    ResponseContentDisposition: `attachment; filename="${key.slice(BACKUP_PREFIX.length)}"`,
  });

  // URL válida por 5 minutos — tempo suficiente para o download começar
  return getSignedUrl(s3, cmd, { expiresIn: 5 * 60 });
}

export async function deleteBackup(key: string): Promise<void> {
  if (!isValidBackupKey(key)) {
    throw new Error("invalid_backup_key");
  }

  const s3 = getBackupS3();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BACKUP_BUCKET,
      Key: key,
    }),
  );
}
