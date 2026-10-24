import "server-only";
import { verify, X509Certificate } from "node:crypto";

export type VerifiedUser = { uid: string };

/** ローカル版（開発・デモ用）はトークンを確認しない。Vercel 上では使えないようにする */
function isLocalMode(): boolean {
  return process.env.NEXT_PUBLIC_BACKEND === "local" && !process.env.VERCEL;
}

// Firebase の ID トークンの署名に使われる公開鍵（証明書）の置き場所
const CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
// 時計のずれを許す秒数
const CLOCK_SKEW_SECONDS = 60;

let certCache: { certs: Record<string, string>; expiresAt: number } | null = null;

/** Google の公開鍵を取ってくる（Cache-Control の max-age のあいだは使いまわす） */
async function fetchCerts(force = false): Promise<Record<string, string>> {
  if (!force && certCache && certCache.expiresAt > Date.now()) return certCache.certs;
  const response = await fetch(CERTS_URL, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error("公開鍵を取得できませんでした");
  const certs = (await response.json()) as Record<string, string>;
  const maxAge = Number(/max-age=(\d+)/.exec(response.headers.get("cache-control") ?? "")?.[1] ?? 3600);
  certCache = { certs, expiresAt: Date.now() + maxAge * 1000 };
  return certs;
}

function decodePart(part: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<string, unknown>;
}

/**
 * Firebase の ID トークンを確認する（https://firebase.google.com/docs/auth/admin/verify-id-tokens の「ライブラリを使わない確認」）。
 * 署名（RS256）・発行元（iss）・対象（aud）・有効期限（exp）・発行時刻（iat）・利用者の ID（sub）を確かめる。
 * firebase-admin は、本番（Vercel）で読み込みエラーになったため使わない
 */
export async function verifyIdToken(token: string, projectId: string, now = Date.now()): Promise<VerifiedUser> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("トークンの形が正しくありません");
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = decodePart(headerPart);
  const payload = decodePart(payloadPart);

  if (header.alg !== "RS256" || typeof header.kid !== "string") throw new Error("トークンの署名の種類が正しくありません");

  // 鍵が入れかわったときのために、見つからなければ1回だけ取りなおす
  let pem = (await fetchCerts())[header.kid];
  if (!pem) pem = (await fetchCerts(true))[header.kid];
  if (!pem) throw new Error("署名の鍵が見つかりません");

  const valid = verify("RSA-SHA256", Buffer.from(`${headerPart}.${payloadPart}`), new X509Certificate(pem).publicKey, Buffer.from(signaturePart, "base64url"));
  if (!valid) throw new Error("署名が正しくありません");

  const seconds = Math.floor(now / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= seconds - CLOCK_SKEW_SECONDS) throw new Error("トークンの期限が切れています");
  if (typeof payload.iat !== "number" || payload.iat > seconds + CLOCK_SKEW_SECONDS) throw new Error("トークンの発行時刻が正しくありません");
  if (payload.aud !== projectId) throw new Error("トークンの対象が正しくありません");
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error("トークンの発行元が正しくありません");
  if (typeof payload.sub !== "string" || payload.sub.length === 0 || payload.sub.length > 128) throw new Error("トークンの利用者が正しくありません");

  return { uid: payload.sub };
}

/** リクエストの Authorization ヘッダーの ID トークンを確認する。ログインしていなければ null */
export async function verifyRequest(request: Request): Promise<VerifiedUser | null> {
  if (isLocalMode()) return { uid: "local" };
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  try {
    return await verifyIdToken(token, projectId);
  } catch {
    return null;
  }
}
