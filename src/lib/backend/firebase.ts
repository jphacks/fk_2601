import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { collection, doc, getDocs, getFirestore, setDoc } from "firebase/firestore";
import { UserFacingError } from "@/lib/errors";
import type { AuthUser, Profile } from "@/lib/types";
import { usernameToEmail, validatePassword, validateUsername } from "@/lib/username";
import type { Backend } from "./types";

// Firebase は呼ばれたときに初めて初期化する（サーバー側の描画で動かないようにするため）
export function firebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  return initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}

export const db = () => getFirestore(firebaseApp());
const auth = () => getAuth(firebaseApp());
const projectId = () => process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "app";

function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, username: user.displayName ?? "" };
}

function friendly(error: unknown): never {
  const code = (error as { code?: string }).code ?? "";
  if (code === "auth/email-already-in-use") throw new UserFacingError("そのなまえは もう つかわれているよ");
  if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
    throw new UserFacingError("なまえか パスワードが ちがうよ");
  }
  if (code === "auth/weak-password") throw new UserFacingError("パスワードは 6もじ以上にしてね");
  if (code === "auth/network-request-failed") throw new UserFacingError("ネットに つながらないよ。つながってから もういちど ためしてね");
  if (code === "auth/too-many-requests") throw new UserFacingError("なんども まちがえたので、しばらくしてから ためしてね");
  throw error;
}

export const firebaseBackend: Backend = {
  mode: "firebase",

  subscribeAuth(callback) {
    return onAuthStateChanged(auth(), (user) => callback(user ? toAuthUser(user) : null));
  },

  async signUp(rawUsername, password) {
    const username = validateUsername(rawUsername);
    validatePassword(password);
    try {
      const credential = await createUserWithEmailAndPassword(auth(), usernameToEmail(username, projectId()), password);
      await updateProfile(credential.user, { displayName: username });
      return { uid: credential.user.uid, username };
    } catch (error) {
      friendly(error);
    }
  },

  async signIn(rawUsername, password) {
    const username = validateUsername(rawUsername);
    validatePassword(password);
    try {
      const credential = await signInWithEmailAndPassword(auth(), usernameToEmail(username, projectId()), password);
      return toAuthUser(credential.user);
    } catch (error) {
      friendly(error);
    }
  },

  async signOut() {
    await firebaseSignOut(auth());
  },

  async getIdToken() {
    return (await auth().currentUser?.getIdToken()) ?? null;
  },

  async listProfiles(uid) {
    const snapshot = await getDocs(collection(db(), "users", uid, "profiles"));
    return snapshot.docs.map((d) => d.data() as Profile).sort((a, b) => a.createdAt - b.createdAt);
  },

  async saveProfile(uid, profile) {
    await setDoc(doc(db(), "users", uid, "profiles", profile.id), profile);
  },
};
