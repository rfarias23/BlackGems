import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

let _client: S3Client | null = null

function getS3Client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: process.env.AWS_S3_REGION || 'us-east-1',
    })
  }
  return _client
}

const getBucket = () => process.env.AWS_S3_BUCKET || ''

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const client = getS3Client()
  await client.send(new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
  return key
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  const client = getS3Client()
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  })
  return getSignedUrl(client, command, { expiresIn: 3600 }) // 1 hour
}

export async function deleteFromS3(key: string): Promise<void> {
  const client = getS3Client()
  await client.send(new DeleteObjectCommand({
    Bucket: getBucket(),
    Key: key,
  }))
}

export function getS3Key(ownerId: string, fileName: string): string {
  const timestamp = Date.now()
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `documents/${ownerId}/${timestamp}_${safeName}`
}
