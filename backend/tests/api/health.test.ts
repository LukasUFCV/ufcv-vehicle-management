import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";

describe("API health", () => {
  it("retourne un état ok", async () => {
    const app = buildApp();
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("protège l'endpoint me sans session", async () => {
    const app = buildApp();
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
  });
});
