import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 64 * 1024 * 1024;

type ScryptOptions = {
  N: number;
  r: number;
  p: number;
  maxmem: number;
};

function scrypt(password: string, salt: Buffer, keyLength: number, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) => {
    nodeScrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: MAX_MEMORY,
  });

  return [
    "scrypt",
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, encodedHash: string) {
  const [algorithm, n, r, p, saltValue, expectedValue, ...unexpected] = encodedHash.split("$");

  if (
    algorithm !== "scrypt" ||
    !n ||
    !r ||
    !p ||
    !saltValue ||
    !expectedValue ||
    unexpected.length > 0
  ) {
    return false;
  }

  const options = {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: MAX_MEMORY,
  };

  if (
    options.N !== SCRYPT_N ||
    options.r !== SCRYPT_R ||
    options.p !== SCRYPT_P
  ) {
    return false;
  }

  try {
    const salt = Buffer.from(saltValue, "base64url");
    const expected = Buffer.from(expectedValue, "base64url");
    const actual = await scrypt(password, salt, expected.length, options);

    return expected.length > 0 && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
