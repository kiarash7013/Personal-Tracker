export const SESSION_VERSION = 1;
export const SESSION_DURATION_SECONDS = 8 * 60 * 60;

export type SessionIdentity = {
  userId: string;
  issuedAt: number;
  expiresAt: number;
};

type SessionPayload = {
  v: number;
  sub: string;
  iat: number;
  exp: number;
};

const encoder = new TextEncoder();

function encodeBase64Url(value: Uint8Array) {
  let binary = "";

  for (const byte of value) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function decodeBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw new Error("Invalid base64url value.");
  }

  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "=",
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(
  userId: string,
  secret: string,
  nowInSeconds = Math.floor(Date.now() / 1_000),
) {
  const payload: SessionPayload = {
    v: SESSION_VERSION,
    sub: userId,
    iat: nowInSeconds,
    exp: nowInSeconds + SESSION_DURATION_SECONDS,
  };
  const encodedPayload = encodeBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await importHmacKey(secret),
    encoder.encode(encodedPayload),
  );

  return `${encodedPayload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token: string,
  secret: string,
  nowInSeconds = Math.floor(Date.now() / 1_000),
): Promise<SessionIdentity | null> {
  try {
    const [encodedPayload, encodedSignature, ...unexpected] = token.split(".");

    if (!encodedPayload || !encodedSignature || unexpected.length > 0) {
      return null;
    }

    const signatureIsValid = await crypto.subtle.verify(
      "HMAC",
      await importHmacKey(secret),
      decodeBase64Url(encodedSignature),
      encoder.encode(encodedPayload),
    );

    if (!signatureIsValid) {
      return null;
    }

    const payload = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedPayload)),
    ) as Partial<SessionPayload>;

    if (
      payload.v !== SESSION_VERSION ||
      typeof payload.sub !== "string" ||
      payload.sub.length === 0 ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number" ||
      !Number.isInteger(payload.iat) ||
      !Number.isInteger(payload.exp) ||
      payload.iat > nowInSeconds + 60 ||
      payload.exp <= nowInSeconds ||
      payload.exp - payload.iat !== SESSION_DURATION_SECONDS
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      issuedAt: payload.iat,
      expiresAt: payload.exp,
    };
  } catch {
    return null;
  }
}
