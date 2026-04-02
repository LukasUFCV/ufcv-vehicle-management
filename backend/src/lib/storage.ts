import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import createHttpError from "http-errors";
import { env } from "../config/env.js";

export async function ensureStorageDirectories() {
  await fs.mkdir(env.UPLOAD_DIR, { recursive: true });
  await fs.mkdir(env.QR_CODE_DIR, { recursive: true });
}

export async function persistBuffer(
  baseDirectory: string,
  originalName: string,
  buffer: Buffer
) {
  const safeName = originalName
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-");

  const fileName = `${Date.now()}-${nanoid(8)}-${safeName}`;
  const absolutePath = path.resolve(baseDirectory, fileName);

  await fs.writeFile(absolutePath, buffer);

  return {
    fileName,
    absolutePath
  };
}

export function assertPathIsInside(baseDirectory: string, absolutePath: string) {
  const normalizedBase = path.resolve(baseDirectory);
  const normalizedPath = path.resolve(absolutePath);

  if (!normalizedPath.startsWith(normalizedBase)) {
    throw createHttpError(403, "Accès au fichier refusé.");
  }
}
