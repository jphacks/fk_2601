// scripts/eval-questions.mts を Node で直接動かすための設定（アプリの本体では使わない）。
// 「@/」（tsconfig の paths）と、拡張子のない import（./schema など）を、src の .ts ファイルに読みかえる
import { register } from "node:module";

register("./alias-hooks.mjs", import.meta.url);
