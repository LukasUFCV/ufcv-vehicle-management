import createHttpError from "http-errors";
import { type User, UserStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { verifyPassword } from "../../lib/password.js";
import type { AuthCredentials, IdentityProvider } from "../identity-provider.js";

export class LocalIdentityProvider implements IdentityProvider {
  providerKey = "LOCAL" as const;

  async authenticate(credentials: AuthCredentials): Promise<User> {
    const normalizedEmail = credentials.email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { professionalEmail: normalizedEmail }],
        deletedAt: null
      }
    });

    if (!user || !user.isActive || user.status === UserStatus.DISABLED) {
      throw createHttpError(401, "Identifiants invalides.");
    }

    const isValid = await verifyPassword(user.passwordHash, credentials.password);

    if (!isValid) {
      throw createHttpError(401, "Identifiants invalides.");
    }

    return user;
  }
}
