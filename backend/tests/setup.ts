process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:5173";
process.env.API_PUBLIC_URL = process.env.API_PUBLIC_URL ?? "http://localhost:4000";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "mysql://rsvehicule:rsvehicule@localhost:3306/rsvehicule";
process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? "test-secret-long-enough";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";
process.env.SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@ufcv.local";
process.env.SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
process.env.SEED_DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "Demo123!";
