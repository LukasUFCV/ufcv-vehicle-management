import argon2 from "argon2";

export async function hashPassword(password: string) {
  return argon2.hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    type: argon2.argon2id
  });
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}
