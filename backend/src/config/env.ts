import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  APP_BASE_URL: z.string().url(),
  API_PUBLIC_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  SESSION_COOKIE_NAME: z.string().min(1).default("rsvehicule_session"),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(12),
  SESSION_SECRET: z.string().min(16),
  CORS_ORIGIN: z.string().min(1),
  UPLOAD_DIR: z.string().default("./storage/uploads"),
  QR_CODE_DIR: z.string().default("./storage/qrcodes"),
  PASSWORD_RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  SMTP_ENABLED: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SEED_ADMIN_EMAIL: z.string().email(),
  SEED_ADMIN_PASSWORD: z.string().min(8),
  SEED_DEMO_PASSWORD: z.string().min(8)
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";
