import { randomBytes } from 'node:crypto'

import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

import { MAX_MEDIA_BYTES } from './media'

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

export type UploadKind = 'cover' | 'inline'

// Every image a post uses lives under posts/<postId>/. The folder is keyed by
// the post id rather than the slug because slugs change on rename, and S3 has
// no rename: moving a folder means copying every object and rewriting every
// URL already embedded in the post's markdown.
const POST_MEDIA_ROOT = 'posts'

// Accepts both Prisma's cuid() ids and the ones from createPostId(). The only
// hard requirement is that the id is a single path-safe segment.
const POST_ID_PATTERN = /^[a-z0-9]{20,36}$/

export function isValidPostId(value: unknown): value is string {
  return typeof value === 'string' && POST_ID_PATTERN.test(value)
}

/**
 * Generates an id for a post that does not exist yet, so the editor has a
 * media prefix to upload into before the first save. Same shape as Prisma's
 * cuid(): "c" + 24 lowercase base36 characters.
 */
export function createPostId(): string {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
  const time = Date.now().toString(36).padStart(8, '0').slice(-8)
  const random = Array.from(randomBytes(16), (byte) => alphabet[byte % 36]).join('')
  return `c${time}${random}`
}

export function postMediaPrefix(postId: string): string {
  return `${POST_MEDIA_ROOT}/${postId}/`
}

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

/**
 * Object names are random and never reused: a replaced image gets a new key
 * instead of overwriting the old one. That is what makes the year-long
 * `immutable` cache header in nginx safe. The uploader's original filename is
 * deliberately not part of the key.
 */
function buildObjectKey(postId: string, kind: UploadKind, contentType: string): string {
  const extension = EXTENSION_BY_TYPE[contentType]
  const name = randomBytes(12).toString('hex')
  const prefix = kind === 'cover' ? COVER_NAME_PREFIX : ''
  return `${postMediaPrefix(postId)}${prefix}${name}.${extension}`
}

const COVER_NAME_PREFIX = 'cover-'

export function isCoverKey(key: string): boolean {
  return key.slice(key.lastIndexOf('/') + 1).startsWith(COVER_NAME_PREFIX)
}

/**
 * Writes a post image to the bucket and returns its key, which is what the
 * caller stores: Post.coverImageUrl holds it as is, and markdown embeds
 * mediaUrl(key). No URL is returned on purpose; see lib/media.ts for why the
 * origin stays out of the database.
 *
 * Only the app writes to MinIO, over the Docker network. See
 * app/api/uploads/route.ts for why uploads no longer use presigned URLs.
 */
export async function uploadPostMedia(
  postId: string,
  kind: UploadKind,
  contentType: string,
  body: Uint8Array
): Promise<string> {
  const key = buildObjectKey(postId, kind, contentType)

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: body.byteLength,
    })
  )

  return key
}

/** Lists every object key under a post's media prefix. */
export async function listPostMediaKeys(postId: string): Promise<string[]> {
  if (!isValidPostId(postId)) {
    throw new Error(`Invalid post id: ${postId}`)
  }

  const keys: string[] = []
  let continuationToken: string | undefined

  do {
    const page = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: process.env.MINIO_BUCKET_NAME!,
        Prefix: postMediaPrefix(postId),
        ContinuationToken: continuationToken,
      })
    )

    for (const object of page.Contents ?? []) {
      if (object.Key) keys.push(object.Key)
    }

    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (continuationToken)

  return keys
}

/**
 * Deletes the given objects one at a time. A post holds a handful of images,
 * and single-object deletes avoid the Content-MD5/checksum requirements that
 * DeleteObjects has against MinIO.
 */
export async function deleteMediaObjects(keys: string[]): Promise<void> {
  for (const key of keys) {
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: process.env.MINIO_BUCKET_NAME!, Key: key })
    )
  }
}

/** Removes every object under a post's media prefix; returns how many. */
export async function deletePostMedia(postId: string): Promise<number> {
  const keys = await listPostMediaKeys(postId)
  await deleteMediaObjects(keys)
  return keys.length
}

const ALLOWED_IMAGE_TYPES = Object.keys(EXTENSION_BY_TYPE)

export function validateFileUpload(contentType: string, size?: number) {
  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    throw new Error(`Invalid content type: ${contentType}`)
  }

  if (size && size > MAX_MEDIA_BYTES) {
    throw new Error(`File too large: ${size} bytes (max ${MAX_MEDIA_BYTES})`)
  }
}
