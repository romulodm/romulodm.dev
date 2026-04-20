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

// ── Env helpers ───────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente obrigatória não definida: ${name}`);
  return value;
}

export function getBackupBucket(): string {
  return requireEnv("BACKUP_S3_BUCKET");
}

export function getBackupPrefix(): string {
  return process.env.BACKUP_S3_PREFIX ?? "postgres/";
}

// ── Cliente S3 ────────────────────────────────────────────────────────────────

export function getBackupS3(): S3Client {
  if (!_client) {
    const accessKeyId = requireEnv("BACKUP_S3_ACCESS_KEY");
    const secretAccessKey = requireEnv("BACKUP_S3_SECRET_KEY");

    _client = new S3Client({
      region: process.env.BACKUP_S3_REGION ?? "us-east-1",
      endpoint: process.env.BACKUP_S3_ENDPOINT, // opcional (MinIO em dev)
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: Boolean(process.env.BACKUP_S3_ENDPOINT),
    });
  }
  return _client;
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface BackupItem {
  key: string;       // chave completa no S3
  filename: string;  // apenas o nome do arquivo
  size: number;      // bytes
  createdAt: string; // ISO
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Valida se a key pertence ao diretório de backups.
 * Previne Path Traversal / acesso a outras áreas do bucket.
 *
 * @param key    - chave S3 a validar
 * @param prefix - prefixo esperado (default: getBackupPrefix())
 */
export function isValidBackupKey(
  key: string,
  prefix: string = getBackupPrefix(),
): boolean {
  if (typeof key !== "string") return false;
  if (key.length === 0 || key.length > 512) return false;
  if (key.includes("..") || key.includes("//")) return false;
  if (!key.startsWith(prefix)) return false;
  // Deve terminar em .dump, .sql.gz ou .sql
  return /\.(dump|sql\.gz|sql)$/i.test(key);
}

// ── Operações ─────────────────────────────────────────────────────────────────

/**
 * Lista todos os backups disponíveis no bucket, paginando automaticamente
 * para não perder objetos quando há mais de 1 000 chaves no prefix.
 */
export async function listBackups(): Promise<BackupItem[]> {
  const s3 = getBackupS3();
  const bucket = getBackupBucket();
  const prefix = getBackupPrefix();

  const items: BackupItem[] = [];
  let continuationToken: string | undefined;

  do {
    const result = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      }),
    );

    const page: BackupItem[] = (result.Contents ?? [])
      .filter((obj) => obj.Key && isValidBackupKey(obj.Key, prefix))
      .map((obj) => ({
        key: obj.Key!,
        filename: obj.Key!.slice(prefix.length),
        size: obj.Size ?? 0,
        createdAt: obj.LastModified?.toISOString() ?? new Date(0).toISOString(),
      }));

    items.push(...page);
    continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (continuationToken);

  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Gera uma URL de download pré-assinada válida por 5 minutos.
 * O filename é codificado em UTF-8 conforme RFC 5987.
 */
export async function getBackupDownloadUrl(key: string): Promise<string> {
  if (!isValidBackupKey(key)) {
    throw new Error("invalid_backup_key");
  }

  const s3 = getBackupS3();
  const filename = key.slice(getBackupPrefix().length);

  const cmd = new GetObjectCommand({
    Bucket: getBackupBucket(),
    Key: key,
    // RFC 5987 — suporta espaços e caracteres não-ASCII sem quebrar o header
    ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
  });

  // URL válida por 5 minutos — tempo suficiente para o download começar
  return getSignedUrl(s3, cmd, { expiresIn: 5 * 60 });
}

/**
 * Remove permanentemente um backup do S3.
 *
 * ATENÇÃO: operação irreversível. Se o bucket tiver versionamento habilitado,
 * prefira desabilitar a deleção direta e deixar uma lifecycle rule remover
 * versões antigas — isso protege contra deleções acidentais ou maliciosas.
 */
export async function deleteBackup(key: string): Promise<void> {
  if (!isValidBackupKey(key)) {
    throw new Error("invalid_backup_key");
  }

  const s3 = getBackupS3();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: getBackupBucket(),
      Key: key,
    }),
  );
}