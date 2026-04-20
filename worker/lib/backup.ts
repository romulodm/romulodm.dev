// worker/src/lib/backup/backup.service.ts

import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client } from "@aws-sdk/client-s3";

/**
 * Executa pg_dump e faz upload do resultado para o S3 em streaming.
 *
 * Evita gravar o dump no disco do container — usa pipe direto.
 */

let _s3: S3Client | null = null;
function getS3(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: process.env.BACKUP_S3_REGION ?? "us-east-1",
      endpoint: process.env.BACKUP_S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.BACKUP_S3_ACCESS_KEY!,
        secretAccessKey: process.env.BACKUP_S3_SECRET_KEY!,
      },
      forcePathStyle: Boolean(process.env.BACKUP_S3_ENDPOINT),
    });
  }
  return _s3;
}

export interface BackupResult {
  key: string;
  size: number;
  durationMs: number;
}

export async function createPostgresBackup(): Promise<BackupResult> {
  const start = Date.now();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL não configurada");

  const bucket = process.env.BACKUP_S3_BUCKET;
  if (!bucket) throw new Error("BACKUP_S3_BUCKET não configurada");

  const prefix = process.env.BACKUP_S3_PREFIX ?? "postgres/";
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const key = `${prefix}backup-${ts}.dump`;

  const pgDump = spawn("pg_dump", ["-Fc", "-Z", "9", databaseUrl], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  pgDump.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  // Promessa do exit code — nunca rejeita, só resolve
  const exitCodePromise = new Promise<number>((resolve) => {
    pgDump.on("close", resolve);
  });

  const upload = new Upload({
    client: getS3(),
    params: {
      Bucket: bucket,
      Key: key,
      Body: pgDump.stdout as unknown as Readable,
      ContentType: "application/octet-stream",
    },
    queueSize: 4,
    partSize: 5 * 1024 * 1024,
  });

  try {
    await upload.done();
  } catch (uploadErr) {
    // Upload falhou — mata o processo para não ficar zumbi
    pgDump.kill();
    await exitCodePromise.catch(() => { }); // aguarda encerrar
    throw uploadErr;
  }

  // Upload concluído — verifica se pg_dump também saiu com sucesso
  const exitCode = await exitCodePromise;
  if (exitCode !== 0) {
    // Dados corrompidos podem ter subido — abort não desfaz multipart já commitado,
    // mas o listBackups filtra por extensão e o backup será inválido de qualquer forma.
    await upload.abort().catch(() => { });
    throw new Error(`pg_dump falhou (exit ${exitCode}): ${stderr.trim()}`);
  }

  console.log(`[backup] dump concluído: ${key} em ${Date.now() - start}ms`);
  if (stderr) console.warn(`[backup] pg_dump stderr: ${stderr.trim()}`);

  return { key, size: 0, durationMs: Date.now() - start };
}