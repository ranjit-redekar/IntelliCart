import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../env.js";
import { requirePermission } from "../plugins/auth.js";
import { badRequest } from "../lib/errors.js";

/**
 * Presigned uploads: the file goes browser -> object store directly and never
 * passes through the API. Today MediaUploader turns images into base64 data
 * URLs held in memory, which means a 2MB photo becomes a 2.7MB string in a
 * JSON body.
 */
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
const MAX_BYTES = 10 * 1024 * 1024;

const s3 = env.S3_ACCESS_KEY
  ? new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: !!env.S3_ENDPOINT, // local S3 (RustFS) needs path-style addressing
      // SDK >=3.729 otherwise bakes a CRC32 of the *empty* body into the presigned
      // URL (x-amz-checksum-crc32=AAAAAA==); AWS S3 rejects the real PUT with a
      // checksum mismatch. RustFS happens not to check it.
      requestChecksumCalculation: "WHEN_REQUIRED",
      credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY ?? "" },
    })
  : null;

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/admin/uploads/sign", { preHandler: requirePermission("products") }, async (req) => {
    const body = z.object({
      contentType: z.enum(ALLOWED),
      contentLength: z.coerce.number().int().positive().max(MAX_BYTES),
    }).parse(req.body);

    if (!s3) throw badRequest("Object storage is not configured on this environment.");

    const ext = body.contentType.split("/")[1] ?? "bin";
    const key = `products/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;

    const url = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        ContentType: body.contentType,
        ContentLength: body.contentLength,
      }),
      { expiresIn: 300 },
    );

    return {
      uploadUrl: url,
      // Where the file will be readable once the PUT completes.
      publicUrl: `${env.S3_ENDPOINT ?? `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`}/${env.S3_BUCKET}/${key}`,
      key,
      expiresIn: 300,
    };
  });
}
