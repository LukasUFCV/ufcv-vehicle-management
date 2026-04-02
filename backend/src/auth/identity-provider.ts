import type { User } from "@prisma/client";

export type AuthCredentials = {
  email: string;
  password: string;
};

export interface IdentityProvider {
  providerKey: "LOCAL" | "MICROSOFT";
  authenticate(credentials: AuthCredentials): Promise<User>;
}
