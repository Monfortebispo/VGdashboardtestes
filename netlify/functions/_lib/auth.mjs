import { createHmac, timingSafeEqual } from "node:crypto";

const encoder = new TextEncoder();
const b64url = (input) => Buffer.from(input).toString("base64url");

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 24) {
    throw new Error("SESSION_SECRET não está configurado ou é demasiado curto.");
  }
  return value;
}

export function passwordMatches(value) {
  const expected = Buffer.from(process.env.ADMIN_PASSWORD || "", "utf8");
  const supplied = Buffer.from(String(value || ""), "utf8");
  if (!expected.length || expected.length !== supplied.length) return false;
  return timingSafeEqual(expected, supplied);
}

export function createAdminToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(JSON.stringify({ role: "admin", iat: now, exp: now + 8 * 60 * 60 }));
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAdminRequest(req) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.role === "admin" && Number(data.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
