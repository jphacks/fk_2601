import { UserFacingError, UsernameTakenError } from "@/lib/errors";
import { GROUP_POSTS_PAGE, GROUPS, type GroupId, type ReactionId } from "@/lib/constants";
import { newJoinCode } from "@/lib/joinCode";
import { PRESENCE_ERROR_MAX } from "@/lib/presence";
import type { ArchiveRecord, AuthUser, GroupMember, GroupMission, GroupPost, GroupPresence, GroupReactions, GroupRole, GroupSettings, Membership, Profile } from "@/lib/types";
import { usernameToLocalId, validatePassword, validateUsername } from "@/lib/username";
import type { Backend } from "./types";

// 開発・デモ用。Firebase なしで動かすため、データはこのブラウザの localStorage に保存する。
// パスワードは保存も確認もしない（認証の自作をしないため）。

const KEY_USERS = "local:users";
const KEY_SESSION = "local:session";
const profilesKey = (uid: string) => `local:profiles:${uid}`;
const archivesKey = (uid: string, profileId: string) => `local:archives:${uid}:${profileId}`;
const groupsKey = (uid: string) => `local:groups:${uid}`;
const groupOwnersKey = (groupId: GroupId) => `local:groupOwners:${groupId}`;
const groupPostsKey = (groupId: GroupId) => `local:groupPosts:${groupId}`;
const groupReportsKey = (groupId: GroupId) => `local:groupReports:${groupId}`;
const groupReactionsKey = (groupId: GroupId) => `local:groupReactions:${groupId}`;
type LocalReaction = { postId: string; uid: string; kind: ReactionId };
const groupSettingsKey = (groupId: GroupId) => `local:groupSettings:${groupId}`;
// 参加コード（#137）：コード → { groupId, open }。グループのいまのコードは groupJoinCodeKey に持つ
const KEY_JOIN_CODES = "local:joinCodes";
const groupJoinCodeKey = (groupId: GroupId) => `local:groupJoinCode:${groupId}`;
type LocalJoinCodes = Record<string, { groupId: GroupId; open: boolean }>;
// 「いま つかっている」（#192）：uid → ようす
const groupPresenceKey = (groupId: GroupId) => `local:groupPresence:${groupId}`;
type LocalPresence = Record<string, Omit<GroupPresence, "uid">>;
// グループのミッション（#139）：日付 → 文
const groupMissionsKey = (groupId: GroupId) => `local:groupMissions:${groupId}`;

type LocalGroups = Partial<Record<GroupId, GroupRole>>;

// 自動で入る期限：ローカル版は、止めるまで期限なしで入れる（止めると、止めた時刻が入る）
function stoppedAt(groupId: GroupId): number | null {
  return readJson<{ autoJoinUntil: number | null }>(groupSettingsKey(groupId), { autoJoinUntil: null }).autoJoinUntil;
}

function autoJoinOpen(groupId: GroupId): boolean {
  const until = stoppedAt(groupId);
  return until === null || Date.now() < until;
}

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

/** デモ用：このブラウザのローカル版のデータをぜんぶ消して、ログインずみのユーザーとプロフィールを1つ用意する */
export function seedLocalUser(user: AuthUser, profile: Profile): void {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("local:"))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // 消せなくても、続ける
  }
  writeJson(KEY_USERS, { [user.username]: user });
  writeJson(KEY_SESSION, user);
  writeJson(profilesKey(user.uid), [profile]);
  // 本物の はじめての登録と同じく、自動で入るグループ（JPHACKS）に入れておく
  writeJson(groupsKey(user.uid), autoJoined({}));
}

function autoJoined(groups: Partial<Record<GroupId, GroupRole>>): Partial<Record<GroupId, GroupRole>> {
  const next = { ...groups };
  for (const g of GROUPS) if (g.autoJoin && !next[g.id] && autoJoinOpen(g.id)) next[g.id] = "member";
  return next;
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
    if (users[username]) throw new UsernameTakenError();
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
    if (!user) throw new UserFacingError("ログイン ID か パスワードが ちがうよ");
    writeJson(KEY_SESSION, user);
    notify();
    return user;
  },

  async signOut() {
    localStorage.removeItem(KEY_SESSION);
    notify();
  },

  async deleteAccount() {
    const user = currentUser();
    if (!user) throw new UserFacingError("ログインしなおしてね");
    // 旧データには持ち主がないため、ずかんの ID も照らし合わせる。
    const archiveKeys = Object.keys(localStorage).filter((key) => key.startsWith(`local:archives:${user.uid}:`));
    const ids = new Set(archiveKeys.flatMap((key) => readJson<ArchiveRecord[]>(key, []).map((a) => a.id)));
    for (const group of GROUPS) {
      const owners = readJson<Record<string, string>>(groupOwnersKey(group.id), {});
      const posts = readJson<GroupPost[]>(groupPostsKey(group.id), []);
      writeJson(groupPostsKey(group.id), posts.filter((post) => owners[post.id] !== user.uid && !(ids.has(post.id) && !owners[post.id])));
      writeJson(groupOwnersKey(group.id), Object.fromEntries(Object.entries(owners).filter(([, uid]) => uid !== user.uid)));
      writeJson(groupReactionsKey(group.id), readJson<LocalReaction[]>(groupReactionsKey(group.id), []).filter((r) => r.uid !== user.uid));
      const presence = readJson<LocalPresence>(groupPresenceKey(group.id), {});
      delete presence[user.uid];
      writeJson(groupPresenceKey(group.id), presence);
    }
    for (const key of archiveKeys) localStorage.removeItem(key);
    localStorage.removeItem(groupsKey(user.uid));
    localStorage.removeItem(profilesKey(user.uid));
    const users = readJson<Record<string, AuthUser>>(KEY_USERS, {});
    delete users[user.username];
    writeJson(KEY_USERS, users);
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

  // ローカル版（開発・デモ用）は、ブラウザの保存場所が小さいので、大きな切り抜きは保存しない（小さな画像だけ）
  async saveArchiveImage() {},

  async deleteArchive(uid, profileId, id) {
    const all = readJson<ArchiveRecord[]>(archivesKey(uid, profileId), []);
    writeJson(archivesKey(uid, profileId), all.filter((r) => r.id !== id));
  },

  async deleteAllArchives(uid, profileId) {
    localStorage.removeItem(archivesKey(uid, profileId));
  },

  // ローカル版は入る期限を持たない。管理者にするときは、localStorage の local:groups:{uid} を手で書きかえる
  async listMemberships(uid) {
    const groups = readJson<Partial<Record<GroupId, GroupRole>>>(groupsKey(uid), {});
    return GROUPS.flatMap((g): Membership[] => {
      const role = groups[g.id];
      return role ? [{ groupId: g.id, role }] : [];
    });
  },

  // ローカル版はログイン ID を別に持たない（メンバーの一覧は、このブラウザのユーザーから作る）
  async joinAutoGroups(uid) {
    writeJson(groupsKey(uid), autoJoined(readJson(groupsKey(uid), {})));
  },

  async listMembers(groupId) {
    return Object.values(readJson<Record<string, AuthUser>>(KEY_USERS, {})).flatMap((u): GroupMember[] => {
      const role = readJson<LocalGroups>(groupsKey(u.uid), {})[groupId];
      return role ? [{ uid: u.uid, username: u.username, role, joinedAt: null }] : [];
    });
  },

  async setMemberRole(groupId, uid, role) {
    const groups = readJson<LocalGroups>(groupsKey(uid), {});
    if (!groups[groupId]) throw new UserFacingError("もう グループに いません");
    writeJson(groupsKey(uid), { ...groups, [groupId]: role });
  },

  async removeMember(groupId, uid) {
    const groups = readJson<LocalGroups>(groupsKey(uid), {});
    delete groups[groupId];
    writeJson(groupsKey(uid), groups);
    const presence = readJson<LocalPresence>(groupPresenceKey(groupId), {});
    delete presence[uid];
    writeJson(groupPresenceKey(groupId), presence);
  },

  async stopAutoJoin(groupId) {
    writeJson(groupSettingsKey(groupId), { autoJoinUntil: Date.now() });
  },

  async getGroupMission(groupId, date) {
    const text = readJson<Record<string, string>>(groupMissionsKey(groupId), {})[date];
    return text ? { groupId, date, text } : null;
  },

  async listGroupMissions(groupId, from, to) {
    return Object.entries(readJson<Record<string, string>>(groupMissionsKey(groupId), {}))
      .filter(([date]) => date >= from && date <= to)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, text]): GroupMission => ({ groupId, date, text }));
  },

  async saveGroupMission(groupId, date, text) {
    writeJson(groupMissionsKey(groupId), { ...readJson<Record<string, string>>(groupMissionsKey(groupId), {}), [date]: text });
  },

  async deleteGroupMission(groupId, date) {
    const all = readJson<Record<string, string>>(groupMissionsKey(groupId), {});
    delete all[date];
    writeJson(groupMissionsKey(groupId), all);
  },

  async getJoinCode(groupId) {
    const code = readJson<string | null>(groupJoinCodeKey(groupId), null);
    const entry = code ? readJson<LocalJoinCodes>(KEY_JOIN_CODES, {})[code] : undefined;
    return code && entry ? { code, open: entry.open } : null;
  },

  async createJoinCode(groupId) {
    const codes = readJson<LocalJoinCodes>(KEY_JOIN_CODES, {});
    const before = readJson<string | null>(groupJoinCodeKey(groupId), null);
    if (before) delete codes[before];
    const code = newJoinCode();
    codes[code] = { groupId, open: true };
    writeJson(KEY_JOIN_CODES, codes);
    writeJson(groupJoinCodeKey(groupId), code);
    return { code, open: true };
  },

  async setJoinCodeOpen(code, open) {
    const codes = readJson<LocalJoinCodes>(KEY_JOIN_CODES, {});
    if (codes[code]) writeJson(KEY_JOIN_CODES, { ...codes, [code]: { ...codes[code], open } });
  },

  async joinWithCode(uid, _username, code) {
    const entry = readJson<LocalJoinCodes>(KEY_JOIN_CODES, {})[code];
    if (!entry) throw new UserFacingError("その コードの グループは みつからないよ。もういちど たしかめてね");
    if (!entry.open) throw new UserFacingError("いまは その グループに はいれないよ。おとなの ひとに きいてね");
    const groups = readJson<LocalGroups>(groupsKey(uid), {});
    if (groups[entry.groupId]) return { groupId: entry.groupId, already: true };
    writeJson(groupsKey(uid), { ...groups, [entry.groupId]: "member" });
    return { groupId: entry.groupId, already: false };
  },

  async getGroupSettings(groupId): Promise<GroupSettings> {
    return { autoJoinUntil: stoppedAt(groupId), open: autoJoinOpen(groupId) };
  },

  async listGroupPosts(groupId, options) {
    const before = options?.before ?? Infinity;
    return readJson<GroupPost[]>(groupPostsKey(groupId), [])
      .filter((p) => p.createdAt < before)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, GROUP_POSTS_PAGE);
  },

  async countGroupPostsSince(groupId, since) {
    return readJson<GroupPost[]>(groupPostsKey(groupId), []).filter((p) => p.createdAt >= since).length;
  },

  async getGroupPost(groupId, id) {
    return readJson<GroupPost[]>(groupPostsKey(groupId), []).find((p) => p.id === id) ?? null;
  },

  // 退会時に、ほかのアカウントの投稿を消さないよう持ち主を残す
  async saveGroupPost(uid, groupId, post) {
    const all = readJson<GroupPost[]>(groupPostsKey(groupId), []).filter((p) => p.id !== post.id);
    writeJson(groupOwnersKey(groupId), { ...readJson<Record<string, string>>(groupOwnersKey(groupId), {}), [post.id]: uid });
    writeJson(groupPostsKey(groupId), [...all, post]);
  },

  async deleteGroupPost(groupId, id) {
    writeJson(groupPostsKey(groupId), readJson<GroupPost[]>(groupPostsKey(groupId), []).filter((p) => p.id !== id));
    const owners = readJson<Record<string, string>>(groupOwnersKey(groupId), {});
    delete owners[id];
    writeJson(groupOwnersKey(groupId), owners);
  },

  // ローカル版は、同じ人が同じ投稿を2回通報しても、1件にしかならない（「だれが」は、uid だけを持つ）
  async reportGroupPost(uid, groupId, postId) {
    const all = readJson<{ postId: string; uid: string }[]>(groupReportsKey(groupId), []);
    if (all.some((r) => r.postId === postId && r.uid === uid)) return;
    writeJson(groupReportsKey(groupId), [...all, { postId, uid }]);
  },

  async listGroupReports(groupId) {
    const counts: Record<string, number> = {};
    for (const r of readJson<{ postId: string }[]>(groupReportsKey(groupId), [])) counts[r.postId] = (counts[r.postId] ?? 0) + 1;
    return counts;
  },

  async listGroupReactions(uid, groupId, postIds) {
    const ids = new Set(postIds);
    const result: GroupReactions = { counts: {}, mine: {} };
    for (const r of readJson<LocalReaction[]>(groupReactionsKey(groupId), [])) {
      if (!ids.has(r.postId)) continue;
      const counts = (result.counts[r.postId] ??= {});
      counts[r.kind] = (counts[r.kind] ?? 0) + 1;
      if (r.uid === uid) result.mine[r.postId] = r.kind;
    }
    return result;
  },

  // Firebase 版のルールと同じく、自分の はてなには送れない
  async setGroupReaction(uid, groupId, postId, reaction) {
    const others = readJson<LocalReaction[]>(groupReactionsKey(groupId), []).filter((r) => !(r.postId === postId && r.uid === uid));
    if (reaction === null) return writeJson(groupReactionsKey(groupId), others);
    if (readJson<Record<string, string>>(groupOwnersKey(groupId), {})[postId] === uid) throw new Error("own post");
    writeJson(groupReactionsKey(groupId), [...others, { postId, uid, kind: reaction }]);
  },

  // Firebase 版と同じく、書かなかった項目（error・help）は前の値のまま
  async savePresence(uid, groupId, write) {
    const all = readJson<LocalPresence>(groupPresenceKey(groupId), {});
    const before = all[uid];
    const now = Date.now();
    const next = {
      username: write.username,
      screen: write.screen,
      at: now,
      error: before?.error ?? null,
      errorAt: before?.errorAt ?? null,
      help: before?.help ?? false,
      helpAt: before?.helpAt ?? null,
    };
    if (write.error !== undefined) {
      next.error = write.error === null ? null : write.error.slice(0, PRESENCE_ERROR_MAX);
      next.errorAt = now;
    }
    if (write.help !== undefined) {
      next.help = write.help;
      if (write.help) next.helpAt = now;
    }
    writeJson(groupPresenceKey(groupId), { ...all, [uid]: next });
  },

  async getOwnHelp(uid, groupId) {
    return readJson<LocalPresence>(groupPresenceKey(groupId), {})[uid]?.help === true;
  },

  async listGroupPresence(groupId, since) {
    return Object.entries(readJson<LocalPresence>(groupPresenceKey(groupId), {}))
      .map(([uid, p]): GroupPresence => ({ uid, ...p }))
      .filter((p) => p.at >= since)
      .sort((a, b) => b.at - a.at);
  },

  async missingGroupPosts(groupId, ids) {
    const existing = new Set(readJson<GroupPost[]>(groupPostsKey(groupId), []).map((p) => p.id));
    return ids.filter((id) => !existing.has(id));
  },
};
