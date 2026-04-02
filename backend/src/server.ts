import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { ensureStorageDirectories } from "./lib/storage.js";

async function bootstrap() {
  await ensureStorageDirectories();

  const app = buildApp();

  app.listen(env.PORT, () => {
    console.log(`RSVehicule API listening on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
