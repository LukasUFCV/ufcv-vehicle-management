import type { AuthContext } from "../lib/permissions.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext | null;
    }
  }
}

export {};
