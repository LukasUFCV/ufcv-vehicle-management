import multer from "multer";
import type { RequestHandler } from "express";
import { asyncHandler } from "../../lib/http.js";
import { listAttachments, readAttachment, storeAttachment } from "./files.service.js";

const allowedMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf"
];

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(new Error("Type de fichier non autorisé."));
      return;
    }

    callback(null, true);
  }
});

export const filesListController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await listAttachments(String(req.query.entityType), String(req.query.entityId));
  res.json({ data: result });
});

export const uploadFileController: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({
      message: "Aucun fichier reçu."
    });
    return;
  }

  const result = await storeAttachment(
    req.auth!,
    String(req.body.entityType),
    String(req.body.entityId),
    req.file
  );

  res.status(201).json({ data: result });
});

export const downloadFileController: RequestHandler = asyncHandler(async (req, res) => {
  const { attachment, buffer } = await readAttachment(String(req.params.attachmentId));

  res.setHeader("Content-Type", attachment.mimeType);
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(attachment.originalName)}"`
  );
  res.send(buffer);
});
