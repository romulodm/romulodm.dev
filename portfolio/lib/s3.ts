import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

interface PresignedUploadResult {
  uploadUrl: string
  publicUrl: string
  key: string
}

export async function generatePresignedUpload(
  filename: string,
  contentType: string,
  kind: 'cover' | 'inline'
): Promise<PresignedUploadResult> {
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `${kind}/${timestamp}-${sanitizedFilename}`

  const command = new PutObjectCommand({
    Bucket: process.env.MINIO_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrlRaw = await getSignedUrl(s3Client, command, {
    expiresIn: 3600,
    unhoistableHeaders: new Set(['x-amz-checksum-crc32', 'x-amz-sdk-checksum-algorithm']),
  })

  // The presigned URL is signed against the internal Docker endpoint —
  // replace it with the public URL so the browser can reach MinIO directly.
  // The HMAC signature remains valid because it covers the path and headers,
  // not the hostname.
  const internalEndpoint = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`
  const uploadUrl = uploadUrlRaw.replace(internalEndpoint, process.env.MINIO_PUBLIC_URL!)

  const publicUrl = `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_BUCKET_NAME}/${key}`

  return {
    uploadUrl,
    publicUrl,
    key,
  }
}

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function validateFileUpload(contentType: string, size?: number) {
  const allowedTypes = [...ALLOWED_IMAGE_TYPES]

  if (!allowedTypes.includes(contentType)) {
    throw new Error(`Invalid content type: ${contentType}`)
  }

  if (size && size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${size} bytes (max ${MAX_FILE_SIZE})`)
  }
}