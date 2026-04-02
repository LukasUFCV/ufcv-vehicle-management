import { createHash } from "node:crypto";
import path from "node:path";
import { promises as fs } from "node:fs";
import createHttpError from "http-errors";
import type { AuthContext } from "../../lib/permissions.js";
import { prisma } from "../../lib/prisma.js";
import { persistBuffer, assertPathIsInside } from "../../lib/storage.js";
import { env } from "../../config/env.js";

export async function listAttachments(entityType: string, entityId: string) {
  return prisma.attachment.findMany({
    where: {
      entityType,
      entityId,
      deletedAt: null
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function storeAttachment(
  auth: AuthContext,
  entityType: string,
  entityId: string,
  file: Express.Multer.File
) {
  const persisted = await persistBuffer(env.UPLOAD_DIR, file.originalname, file.buffer);
  const checksum = createHash("sha256").update(file.buffer).digest("hex");
  const storageKey = path.relative(process.cwd(), persisted.absolutePath);

  return prisma.attachment.create({
    data: {
      entityType,
      entityId,
      storageKey,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      checksum,
      uploadedById: auth.user.id
    }
  });
}

export async function readAttachment(attachmentId: string) {
  const attachment = await prisma.attachment.findUnique({
    where: {
      id: attachmentId
    }
  });

  if (!attachment || attachment.deletedAt) {
    throw createHttpError(404, "Fichier introuvable.");
  }

  const absolutePath = path.resolve(process.cwd(), attachment.storageKey);
  assertPathIsInside(env.UPLOAD_DIR, absolutePath);
  const buffer = await fs.readFile(absolutePath);

  return {
    attachment,
    buffer
  };
}
