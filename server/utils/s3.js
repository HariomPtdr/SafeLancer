/**
 * s3.js
 * AWS S3 upload utility. Replaces the local disk / ImageKit fallback.
 *
 * When AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET are set,
 * files are uploaded to S3 and a public HTTPS URL is returned.
 *
 * When keys are NOT set (local dev without AWS), it falls back to local disk
 * at /server/uploads/ exactly as before — so development works without any config.
 */

const fs   = require('fs');
const path = require('path');

const S3_CONFIGURED = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET
);

let s3Client = null;
let PutObjectCommand = null;
let GetObjectCommand = null;
let getSignedUrl = null;

if (S3_CONFIGURED) {
  const { S3Client, PutObjectCommand: Put, GetObjectCommand: Get } = require('@aws-sdk/client-s3');
  const { getSignedUrl: gsu } = require('@aws-sdk/s3-request-presigner');
  PutObjectCommand = Put;
  GetObjectCommand = Get;
  getSignedUrl = gsu;
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  console.log('[S3] Configured — uploads will go to AWS S3 bucket:', process.env.AWS_S3_BUCKET);
} else {
  console.log('[S3] Not configured — falling back to local disk storage');
}

/* ─── Local fallback ─────────────────────────────────────── */
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function safeName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/* ─── Main upload function ───────────────────────────────── */
/**
 * Upload a buffer to S3 (or local disk in dev).
 * @param {Buffer} buffer        File data
 * @param {string} fileName      Original file name (used as S3 key suffix)
 * @param {string} [folder]      S3 key prefix, e.g. 'avatars'
 * @param {string} [mimeType]    MIME type for Content-Type header
 * @returns {Promise<string>}    Public URL (S3) or local path
 */
async function uploadToS3(buffer, fileName, folder = 'misc', mimeType = 'application/octet-stream') {
  const unique = `${folder}/${Date.now()}-${safeName(fileName)}`;

  if (S3_CONFIGURED) {
    const bucket = process.env.AWS_S3_BUCKET;
    await s3Client.send(new PutObjectCommand({
      Bucket:      bucket,
      Key:         unique,
      Body:        buffer,
      ContentType: mimeType,
    }));
    const region = process.env.AWS_REGION || 'ap-south-1';
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${unique}`;
    console.log('[S3] Uploaded:', url);
    return url;
  }

  // Local fallback
  const localName = `${Date.now()}-${safeName(fileName)}`;
  const filePath  = path.join(UPLOADS_DIR, localName);
  await fs.promises.writeFile(filePath, buffer);
  console.log('[LocalUpload] Saved:', filePath);
  return `/uploads/${localName}`;
}

/* ─── Presigned URL for protected downloads ─────────────── */
/**
 * Generate a time-limited presigned GET URL for a private S3 object.
 * Falls back to the original URL if not on S3 or S3 not configured.
 * @param {string} urlOrKey     Full S3 URL or key
 * @param {number} [expiresIn]  Seconds until expiry (default 3600 = 1 hr)
 * @returns {Promise<string>}
 */
async function getPresignedUrl(urlOrKey, expiresIn = 3600) {
  if (!S3_CONFIGURED || !urlOrKey) return urlOrKey;

  // Extract key from full S3 URL
  let key = urlOrKey;
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || 'ap-south-1';
  const prefix = `https://${bucket}.s3.${region}.amazonaws.com/`;
  if (urlOrKey.startsWith(prefix)) key = urlOrKey.slice(prefix.length);

  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3Client, cmd, { expiresIn });
}

module.exports = { uploadToS3, getPresignedUrl, S3_CONFIGURED };
