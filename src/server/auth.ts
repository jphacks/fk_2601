import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export type VerifiedUser = { uid: string };

/** ローカル版（開発・デモ用）はトークンを確認しない。Vercel 上では使えないようにする */
function isLocalMode(): boolean {
  return process.env.NEXT_PUBLIC_BACKEND === "local" && !process.env.VERCEL;
}

function adminAuth() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getAuth();
}

/** リクエストの Authorization ヘッダーの ID トークンを確認する。ログインしていなければ null */
export async function verifyRequest(request: Request): Promise<VerifiedUser | null> {
  if (isLocalMode()) return { uid: "local" };
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}
