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
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { UserFacingError, UsernameTakenError } from "@/lib/errors";
import { GROUPS } from "@/lib/constants";
import type { ArchiveRecord, AuthUser, GroupMember, GroupPost, Membership, Profile } from "@/lib/types";
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
  if (code === "auth/email-already-in-use") throw new UsernameTakenError();
  if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
    throw new UserFacingError("ログイン ID か パスワードが ちがうよ");
  }
  if (code === "auth/weak-password") throw new UserFacingError("パスワードは 6もじ いじょうに してね");
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

  async listArchives(uid, profileId) {
    const snapshot = await getDocs(query(collection(db(), "users", uid, "profiles", profileId, "archives"), orderBy("createdAt", "desc")));
    return snapshot.docs.map((d) => d.data() as ArchiveRecord);
  },

  async saveArchive(uid, profileId, record) {
    // Firestore は undefined を保存できないので、JSON を通して取り除く
    await setDoc(doc(db(), "users", uid, "profiles", profileId, "archives", record.id), JSON.parse(JSON.stringify(record)));
  },

  async deleteArchive(uid, profileId, id) {
    await deleteDoc(doc(db(), "users", uid, "profiles", profileId, "archives", id));
  },

  async deleteAllArchives(uid, profileId) {
    const snapshot = await getDocs(collection(db(), "users", uid, "profiles", profileId, "archives"));
    // 1回の書き込みは 500 件まで
    for (let i = 0; i < snapshot.docs.length; i += 400) {
      const batch = writeBatch(db());
      snapshot.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  },

  async listMemberships(uid) {
    // 入っているグループは少ない（GROUPS）ので、1つずつ自分のメンバーの記録を見る（本人だけが読める。firestore.rules）
    const snapshots = await Promise.all(GROUPS.map((g) => getDoc(doc(db(), "groups", g.id, "members", uid))));
    return snapshots.flatMap((snapshot, i): Membership[] =>
      snapshot.exists() ? [{ groupId: GROUPS[i].id, role: snapshot.data().role === "admin" ? "admin" : "member" }] : [],
    );
  },

  // 入れるのは、グループの autoJoinUntil より前だけ（firestore.rules）。過ぎていたら断られるので、何もしない。
  // ログイン ID は、ルールで ID トークンの名前と同じかを確かめる。登録した直後のトークンには名前がないことがあるので、取り直してから書く
  async joinAutoGroups(uid, username) {
    await auth().currentUser?.getIdToken(true);
    for (const g of GROUPS) {
      if (!g.autoJoin) continue;
      const ref = doc(db(), "groups", g.id, "members", uid);
      // もう入っている人（管理者など）の記録を上書きしない（ルールでも本人の更新を断る）
      if ((await getDoc(ref)).exists()) continue;
      try {
        await setDoc(ref, { role: "member", joinedAt: serverTimestamp(), username });
      } catch (error) {
        if ((error as { code?: string }).code !== "permission-denied") throw error;
        // トークンの名前が合わなかったときのために、ログイン ID なしで1回だけ入りなおす（期限切れなら、これも断られる）
        try {
          await setDoc(ref, { role: "member", joinedAt: serverTimestamp() });
        } catch (retry) {
          if ((retry as { code?: string }).code !== "permission-denied") throw retry;
        }
      }
    }
  },

  async listMembers(groupId) {
    const snapshot = await getDocs(collection(db(), "groups", groupId, "members"));
    return snapshot.docs.map((d): GroupMember => {
      const data = d.data();
      return {
        uid: d.id,
        username: typeof data.username === "string" ? data.username : null,
        role: data.role === "admin" ? "admin" : "member",
        joinedAt: (data.joinedAt as Timestamp | undefined)?.toMillis?.() ?? null,
      };
    });
  },

  async setMemberRole(groupId, uid, role) {
    await updateDoc(doc(db(), "groups", groupId, "members", uid), { role });
  },

  async removeMember(groupId, uid) {
    await deleteDoc(doc(db(), "groups", groupId, "members", uid));
  },

  // ルールで、いまの時刻（サーバーの時計）にするときだけ通す
  async stopAutoJoin(groupId) {
    await updateDoc(doc(db(), "groups", groupId), { autoJoinUntil: serverTimestamp() });
  },

  async getGroupSettings(groupId) {
    const snapshot = await getDoc(doc(db(), "groups", groupId));
    const until = (snapshot.data()?.autoJoinUntil as Timestamp | undefined)?.toMillis?.() ?? null;
    // 端末の時計で決めるのは、表示のためだけ（入れるかどうかは、ルールがサーバーの時刻で決める）
    return { autoJoinUntil: until, open: until !== null && Date.now() < until };
  },

  async listGroupPosts(groupId) {
    const snapshot = await getDocs(query(collection(db(), "groups", groupId, "posts"), orderBy("createdAt", "desc"), limit(30)));
    return snapshot.docs.map((d) => d.data() as GroupPost);
  },

  // 持ち主はだれも読めない owners に分け、投稿と同じバッチで書く・消す（firestore.rules）
  async saveGroupPost(uid, groupId, post) {
    const batch = writeBatch(db());
    batch.set(doc(db(), "groups", groupId, "posts", post.id), JSON.parse(JSON.stringify(post)));
    batch.set(doc(db(), "groups", groupId, "owners", post.id), { uid });
    await batch.commit();
  },

  async deleteGroupPost(groupId, id) {
    const batch = writeBatch(db());
    batch.delete(doc(db(), "groups", groupId, "posts", id));
    batch.delete(doc(db(), "groups", groupId, "owners", id));
    await batch.commit();
  },

  // 端末に残った古い写しで「ない」と判断しないよう、サーバーに聞く
  async missingGroupPosts(groupId, ids) {
    const snapshots = await Promise.all(ids.map((id) => getDocFromServer(doc(db(), "groups", groupId, "posts", id))));
    return snapshots.filter((s) => !s.exists()).map((s) => s.id);
  },
};
