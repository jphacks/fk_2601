# 技術計画書

企画書（`docs/01-overview.md`）のうち、技術に関わるものをまとめる。
2章の技術スタックはチームの Discord で合意するまで案とする。

## 1 決まっていること
- LLM の出力は JSON で構造化する（問い・式・変数・単位・正解・解説・出典）。条件変更のスライダーは、この式と変数を使ってアプリ側で再計算する
- LLM に送る画像は囲んだ範囲の切り抜きだけにする（全体の画像は送らない）
- 応答待ちを短くするため、囲んだ直後に LLM の呼び出しを始め、認識結果の確認中も裏で問いを作る（先読み生成）
- 通信はオンライン必須（通信できないときはエラーを表示する）
- アーカイブはクラウドに保存する（写真は切り抜きのみ）
- 認証は自作せず Firebase Authentication を使う（パスワードリセットはなし。理由は2.1）
- API の利用回数はハッカソン期間中は制限しない
- MVP ではテストを書かない（フェーズ 3-0 で入れる）

## 2 技術スタック
| 項目 | 決定 | 理由 |
|---|---|---|
| プラットフォーム | Web アプリ（PWA） | URL を開くだけでスマホ実機で動き、ストアへの提出が要らない |
| フロントエンド | Next.js（React + TypeScript） | 画面とサーバー側の処理（LLM の呼び出し）を1つのリポジトリで書ける |
| CSS | Tailwind CSS | スマホ幅への対応が書きやすく、分担しても書き方がそろいやすい |
| パッケージ管理 | npm | 全員が追加のインストールなしで使える |
| DB | Firebase（Firestore） | 導入が速く、セキュリティルールで「本人だけ」を制御できる |
| 画像の保存先 | Firebase（Storage） | 同上 |
| 認証 | Firebase Authentication | 認証を自作しない。Firestore・Storage のルールと連携できる |
| ホスティング | Vercel | Next.js をそのまま公開でき、PR ごとに HTTPS のプレビュー URL が出る（スマホでカメラを試せる） |
| LLM | Claude Opus 5.5（`claude-opus-5-5`） | 画像入力と JSON の構造化出力に対応。問いの質と正確さを優先 |
| 式の計算 | math.js | LLM が出した式を、eval を使わずに安全に計算できる。単位の変換もできる |
| JSON の検証 | Zod | JSON の形を1か所で定義し、型と検証の両方に使える |

- 使うパッケージ（予定）：`next` `react` `tailwindcss` `firebase` `firebase-admin` `@anthropic-ai/sdk` `mathjs` `zod`。追加するときは AGENTS.md の禁止事項3に従って確認する

### 2.1 認証の方式
- ログイン ID はユーザー名。内部で `<ユーザー名>@<FirebaseのプロジェクトID>.firebaseapp.com` に変換して、Firebase Authentication のメール／パスワード方式で登録する（アプリからメールは送らない）
- メールアドレスを集めないため、パスワードリセットはできない（パスワードを忘れるとアーカイブに戻れない）
- 1つのアカウントの中に複数のプロフィール（子どもごと）を持つ

### 2.2 LLM の呼び出し
- Next.js の Route Handler（サーバー側）から公式 SDK（`@anthropic-ai/sdk`）で呼ぶ。`ANTHROPIC_API_KEY` はサーバー側の環境変数だけに置く
- API はログインした人だけが呼べるようにする。画面から Firebase の ID トークンを送り、サーバー側で `firebase-admin` を使って検証する（URL を知っている人に使われて課金が膨らむのを防ぐ）
- 出力は構造化出力（`output_config.format`）で JSON の形を指定し、受け取った後に Zod でも検証する
- 断られたとき（`stop_reason: "refusal"`）に備えて、別のモデルに切り替える `fallbacks` を設定する
- effort（考える深さ）は medium。環境変数 `LLM_EFFORT` で変えられるようにし、Hack Day で同じ写真を使って low / high と比べる
- 料金の目安：1回あたり約 $0.05（入力約 4,000・出力約 1,500 トークンでの粗い試算。実装後に測る）

### 2.3 Vercel の制限（Hobby プラン）
- 関数の実行時間：最大 300 秒。60 秒で打ち切る（5.4）ので収まる。ストリーミングは使わない
- リクエスト・レスポンスの大きさ：4.5 MB まで。画像を長辺 1024px に縮小する（5.1）ので収まる
- 関数が動く地域：初期設定はアメリカ（`iad1`）なので、東京（`hnd1`）に変える

## 3 全体構成
```
[スマホのブラウザ（Next.js の画面）]
   │  撮影・囲む・切り抜き・縮小・予想・可視化・math.js で再計算
   │
   ├─ Firebase Authentication ……… ログイン（ID トークンを受け取る）
   ├─ Firestore ………………………… プロフィール・アーカイブを読み書き（ルールで本人だけ）
   ├─ Storage …………………………… 切り抜き画像を保存（ルールで本人だけ）
   │
   └─ Next.js の Route Handler（Vercel・東京）
         │  ID トークンを firebase-admin で検証
         └─ Claude API（API キーはここだけ）
```
- クライアント：撮影、囲む操作と切り抜き、予想の入力、可視化、再計算、アーカイブの表示。Firebase に直接読み書きする
- サーバー：LLM の呼び出しだけ。DB には書かない（保存は画面から行う）

## 4 処理の流れ
```
撮影 → 囲む → 切り抜き・縮小（EXIF も消える）
  → /api/questions に「画像 + 学年 + 出題済みの組み合わせ」を送る（ここから裏で生成）
  → 「これは○○だね？」の確認（違えば修正して作り直す）
  → 問い 3 つ（JSON）→ 検証・math.js で正解を計算 → 選ぶ → 予想
  → 答え合わせ・可視化 → スライダーで再計算 → アーカイブ保存（Firestore + Storage）
```
- 自分で問いを書いた場合は、`/api/questions/custom` に「画像 + 学年 + 問いの文」を送り、同じ形の問いを 1 つ受け取る
- 認識結果を修正したときは、修正した名前を付けてもう一度呼ぶ（ユーザーの操作で呼ぶ1回であり、自動リトライではない）

## 5 LLM
### 5.1 入力
- 画像：囲んだ範囲の切り抜きだけ。ブラウザの Canvas で長辺 1024px の JPEG に描き直す（このとき EXIF も消える）。保存用（Storage）にも同じ画像を使う
- 学年
- 出題済みの「対象×分野（単元）」の組み合わせ（そのプロフィールのアーカイブから取り出す）
- （修正時）ユーザーが直した認識結果／（自分で書く方式）問いの文

### 5.2 出力（JSON）
| 項目 | 内容 | 型・形式 |
|---|---|---|
| 認識結果 | 「これは○○だね？」に使う名前と、問いが作れるか | `recognition: { label: string, canAsk: boolean }` |
| 問い | 問題文（学年に合わせた漢字・ふりがな） | `questions[].text: string`（ふりがなの書き方：【未決】） |
| 問いのタイプ | 数量推定・比較・「なぜ？」型 | `questions[].type: "estimate" \| "compare" \| "why"` |
| 分類 | 算数・理科・情報／単元／対象 | `subject: "math" \| "science" \| "info"`、`topic: string`、`target: string` |
| 式 | math.js で計算できる式。「なぜ？」型は null | `formula: string \| null`（例：`"length * width / tileArea"`） |
| 変数 | 名前・表示名・値・単位・スライダーの範囲 | `variables: { name, label, value, unit, min, max, step }[]` |
| 単位 | 答えの単位（学年で習ったもの） | `answerUnit: string` |
| 正解 | LLM が考えた値（確認用。表示には使わない） | `llmAnswer: number \| null` |
| 選択肢 | 「なぜ？」型の理由の文章（正解の印つき） | `choices: { text, correct }[] \| null` |
| 解説 | まず一言と、タップで見る計算過程のステップ | `explanation: { short: string, steps: string[] }` |
| 出典 | 根拠データ・前提条件 | `sources: { title: string, url: string \| null, assumption: string }[]` |

- 1回に出す問いの数：問い生成は 3 つ（3択方式のため）、自分で書いた問いは 1 つ
- 比較型の式と答えの持ち方：【未決】（02-spec で予想の入力方法が決まってから）
- 正解の担保の仕方：
  - 表示する正解は、math.js で式と変数から計算した値を使う（LLM の値は使わない）
  - LLM の値（`llmAnswer`）と計算値が大きくずれる問いは、式が間違っているとみなして出さない（ずれの許容範囲：【未決】）
  - 3 つとも出せないときはエラー表示にする

### 5.3 プロンプト
- 直感が外れやすい問いの例を与える
- 学年に合わせた問い・漢字・単位にする
- 出題済みの組み合わせと同じ問いを出さない
- 子ども向けとして不適切・危険な内容（火・刃物・電気・薬品・高い所・道路など）を出さないよう制約する
- 計算は LLM にさせず、式と変数を出させる
- 置き場所：LLM まわりは `src/server/llm/` にまとめ、画面側から import できないようにする（`server-only`）
```
src/
  app/api/questions/route.ts         … 問い生成
  app/api/questions/custom/route.ts  … 自分で書いた問い
  server/llm/prompts.ts              … プロンプト（ここだけに書く）
  server/llm/schema.ts               … JSON の形（Zod。検証と型に使う）
  server/llm/client.ts               … Claude の呼び出し
```
- アプリ全体のディレクトリ構成は Issue #6 で決める

### 5.4 エラー処理
- 形式の崩れ・タイムアウト・API エラー・断られたとき・ID トークンが無効なときに、子どもにも分かるメッセージとやり直すボタンを出す
- タイムアウト：60 秒（待ち時間はナビゲーターキャラの豆知識でつなぐ）
- 自動リトライはしない（課金とレート制限のため。SDK の自動リトライも 0 にする）
- ログに画像・トークン・API キーを出さない

## 6 データ
| データ | 主な項目 | 保存先 |
|---|---|---|
| アカウント | ユーザー名（メール形式に変換したもの）・パスワード | Firebase Authentication（パスワードはアプリで扱わない） |
| プロフィール | ニックネーム・学年 | Firestore |
| アーカイブ | 問い・式・変数・予想・結果・解説・出典・分類 | Firestore |
| 切り抜き画像 | | Storage |
| 出題済み | 対象×分野（単元） | アーカイブから取り出す（別に保存しない） |

- 構成：
```
Firestore:
  users/{uid}
    └ profiles/{profileId}          nickname, grade, createdAt
         └ archives/{archiveId}     question（5.2 の問い 1 つ分）, guess, result,
                                    imagePath, createdAt

Storage:
  users/{uid}/{profileId}/{archiveId}.jpg
```
- アクセス制御：Firestore・Storage のセキュリティルールで、`users/{uid}` の下は uid が自分のときだけ読み書きできるようにする
- 削除：個別・一括で削除できる（Firestore のドキュメントと Storage の画像を両方消す）

## 7 開発環境
- 環境変数：`.env.example` にキー名だけを載せ、実際の値は `.env`（git 管理外）に置く。Vercel には管理画面で設定する
  - サーバー側だけ：`ANTHROPIC_API_KEY`、`LLM_EFFORT`、firebase-admin のサービスアカウントの値
  - クライアント側（公開されても問題ない値）：Firebase の設定値（`NEXT_PUBLIC_FIREBASE_*`）
- Windows（PowerShell）でも動くようにする
- コマンド（予定。ひな形を作った後に確定して AGENTS.md に書く）
  | 用途 | コマンド |
  |---|---|
  | 依存関係のインストール | `npm install` |
  | 開発サーバーの起動 | `npm run dev` |
  | lint | `npm run lint` |
  | 型チェック | `npx tsc --noEmit` |
  | テスト | なし（MVP では書かない） |
- スマホ実機で試すときは Vercel のプレビュー URL（HTTPS）を使う（カメラは HTTPS か localhost でしか動かないため）

## 8 未決事項
| 項目 | 候補 |
|---|---|
| 比較型の式と答えの持ち方 | 02-spec で予想の入力方法が決まってから |
| LLM の値と計算値のずれの許容範囲 | 例：1% 以内 |
| ふりがなの書き方 | `<ruby>` タグ／「漢字（かんじ）」形式 など |
| effort の値 | medium で始め、Hack Day に low／high と比べる |
