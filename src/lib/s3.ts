import AWS from "aws-sdk"

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "ap-southeast-1",
})

const bucket = process.env.AWS_S3_BUCKET || "allcattle-media"

export interface PresignedUploadResult {
  url: string
  fields: Record<string, string>
  key: string
}

export async function createPresignedUploadUrl(params: {
  key: string
  contentType: string
  expiresIn?: number
}): Promise<PresignedUploadResult> {
  const { key, contentType, expiresIn = 300 } = params

  const post = s3.createPresignedPost({
    Bucket: bucket,
    Fields: {
      key,
      "Content-Type": contentType,
    },
    Expires: expiresIn,
    Conditions: [
      ["content-length-range", 0, 200 * 1024 * 1024], // 200MB max
      ["starts-with", "$Content-Type", contentType.split("/")[0] + "/"],
    ],
  })

  return {
    url: post.url,
    fields: post.fields,
    key,
  }
}

export async function createPresignedDownloadUrl(params: {
  key: string
  expiresIn?: number
}): Promise<string> {
  const { key, expiresIn = 3600 } = params

  return s3.getSignedUrl("getObject", {
    Bucket: bucket,
    Key: key,
    Expires: expiresIn,
  })
}

export async function deleteObject(key: string): Promise<void> {
  await s3.deleteObject({
    Bucket: bucket,
    Key: key,
  }).promise()
}

export async function copyObject(params: {
  sourceKey: string
  destinationKey: string
}): Promise<void> {
  const { sourceKey, destinationKey } = params

  await s3.copyObject({
    Bucket: bucket,
    CopySource: `${bucket}/${sourceKey}`,
    Key: destinationKey,
  }).promise()
}

export function generateMediaKey(params: {
  tenantId: string
  companyId: string
  farmId: string
  animalId: string
  pose: string
  extension: string
}): string {
  const { tenantId, companyId, farmId, animalId, pose, extension } = params
  const timestamp = Date.now()
  return `tenant/${tenantId}/company/${companyId}/farm/${farmId}/animal/${animalId}/${timestamp}_${pose}.${extension}`
}

export function getPublicUrl(key: string): string {
  const domain = process.env.AWS_S3_DOMAIN || `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com`
  return `${domain}/${key}`
}

// Alias for backward compatibility
export const s3CreatePresignedPut = createPresignedUploadUrl
