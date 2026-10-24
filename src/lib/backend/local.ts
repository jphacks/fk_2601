import { UserFacingError } from "@/lib/errors";
import type { ArchiveRecord, AuthUser, Profile, PublicPost } from "@/lib/types";
import { usernameToLocalId, validatePassword, validateUsername } from "@/lib/username";
import type { Backend } from "./types";

// 開発・デモ用。Firebase なしで動かすため、データはこのブラウザの localStorage に保存する。
// パスワードは保存も確認もしない（認証の自作をしないため）。

const KEY_USERS = "local:users";
const KEY_SESSION = "local:session";
const profilesKey = (uid: string) => `local:profiles:${uid}`;
const archivesKey = (uid: string, profileId: string) => `local:archives:${uid}:${profileId}`;
const KEY_PUBLIC = "local:public";

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new UserFacingError("ほぞんする ばしょが いっぱいだよ。ふるいものを けしてね");
  }
}

const listeners = new Set<(user: AuthUser | null) => void>();

function currentUser(): AuthUser | null {
  return readJson<AuthUser | null>(KEY_SESSION, null);
}

function notify(): void {
  const user = currentUser();
  listeners.forEach((l) => l(user));
}

export const localBackend: Backend = {
  mode: "local",

  subscribeAuth(callback) {
    listeners.add(callback);
    const timer = setTimeout(() => callback(currentUser()), 0);
    return () => {
      clearTimeout(timer);
      listeners.delete(callback);
    };
  },

  async signUp(rawUsername, password) {
    const username = validateUsername(rawUsername);
    validatePassword(password);
    const users = readJson<Record<string, AuthUser>>(KEY_USERS, {});
    if (users[username]) throw new UserFacingError("そのなまえは もう つかわれているよ");
    const user: AuthUser = { uid: `local-${usernameToLocalId(username)}`, username };
    writeJson(KEY_USERS, { ...users, [username]: user });
    writeJson(KEY_SESSION, user);
    notify();
    return user;
  },

  async signIn(rawUsername, password) {
    const username = validateUsername(rawUsername);
    validatePassword(password);
    const user = readJson<Record<string, AuthUser>>(KEY_USERS, {})[username];
    if (!user) throw new UserFacingError("なまえか パスワードが ちがうよ");
    writeJson(KEY_SESSION, user);
    notify();
    return user;
  },

  async signOut() {
    localStorage.removeItem(KEY_SESSION);
    notify();
  },

  async getIdToken() {
    return null;
  },

  async listProfiles(uid) {
    return readJson<Profile[]>(profilesKey(uid), []);
  },

  async saveProfile(uid, profile) {
    const all = readJson<Profile[]>(profilesKey(uid), []);
    const next = all.some((p) => p.id === profile.id)
      ? all.map((p) => (p.id === profile.id ? profile : p))
      : [...all, profile];
    writeJson(profilesKey(uid), next);
  },

  async listArchives(uid, profileId) {
    return readJson<ArchiveRecord[]>(archivesKey(uid, profileId), []).sort((a, b) => b.createdAt - a.createdAt);
  },

  async saveArchive(uid, profileId, record) {
    const all = readJson<ArchiveRecord[]>(archivesKey(uid, profileId), []).filter((r) => r.id !== record.id);
    writeJson(archivesKey(uid, profileId), [...all, record]);
  },

  async deleteArchive(uid, profileId, id) {
    const all = readJson<ArchiveRecord[]>(archivesKey(uid, profileId), []);
    writeJson(archivesKey(uid, profileId), all.filter((r) => r.id !== id));
  },

  async deleteAllArchives(uid, profileId) {
    localStorage.removeItem(archivesKey(uid, profileId));
  },

  async listPublic() {
    return readJson<PublicPost[]>(KEY_PUBLIC, []).sort((a, b) => b.createdAt - a.createdAt);
  },

  async savePublic(post) {
    const all = readJson<PublicPost[]>(KEY_PUBLIC, []).filter((p) => p.id !== post.id);
    writeJson(KEY_PUBLIC, [...all, post]);
  },

  async deletePublic(id) {
    writeJson(KEY_PUBLIC, readJson<PublicPost[]>(KEY_PUBLIC, []).filter((p) => p.id !== id));
  },
};
