# デザイン見本（MVP・ポップ案）

画面の見た目・色・部品のルールをまとめた見本です。**アプリのコードではありません。**
アプリ（Next.js + Tailwind CSS）を作るときに、見た目と動きをそろえるための参照として使ってください。

## 見かた
- `design/index.html` をブラウザで開くと、全画面が一覧で見られます（Google Fonts を読むのでネット接続が必要）
- 各画面は `design/screens/` に1枚ずつあります。ボタンを押すと次の画面に進み、スライダーやクイズは実際に動きます
- 見本のスライダーやクイズを動かしている `screen.js` と、一覧用の `screen.css` はアプリには持ち込みません

## フォルダの中身
```
design/
├── README.md            # このファイル
├── index.html           # 全画面の一覧
├── tokens.css           # 色・文字・影・角丸（素の CSS 変数。見本の HTML が使う）
├── tailwind-theme.css   # tokens.css と同じ値を Tailwind v4 の @theme で書いたもの（アプリで使う）
├── screen.css           # 見本の HTML だけで使う共通 CSS
├── screen.js            # 見本の HTML だけで使う小さな動き
├── assets/navi/         # ナビの7つの表情（透過 PNG・480px 四方。svg/ に同じ絵のベクター版）
└── screens/             # 画面の見本（00〜22）
```

## コンセプト：まちの はてなを つかまえろ！
投げ縄で囲む操作を、虫とりのように「はてなを つかまえる」遊びに見立てています。
子どもが見る言葉は、仕様の用語を次のように言いかえます（仕様書・コードの名前は変えなくてよい）。

| 子どもが見る言葉 | 仕様の用語 |
|---|---|
| さがす | 撮影 |
| つかまえる | 囲む |
| はてな | 問い |
| せーの！ | 予想を決める |
| しょうたい | 答え合わせ |
| なぞとき | 解説 |
| もしも | 条件変更 |
| はてなずかん | 図鑑（アーカイブ） |

## 色
背景は白。色は「意味」で使い分けます。トークン名は `tokens.css` / `tailwind-theme.css` と同じです。

| 名前 | 値 | 使うところ |
|---|---|---|
| `ink` | #22223A | 文字・すべての線・影 |
| `navi` | #4A5AE8 | ナビ・メインボタン・こたえ・さんすう |
| `yellow` | #FFC83D | ほめる・今日のお題・スコアボード |
| `pink` | #FF6F9C | きみ（予想した数の印）・「せーの！」ボタン |
| `mint` | #24C3A0 | りか・「うん！」 |
| `purple` | #8B5CF6 | じょうほう・しょうごう |
| `orange` | #FF8A3D | おしい（`zure` #FFB547 は数直線のズレの帯） |
| `red` | #F0444F | **ピタリ（正解）だけ**。学校の赤丸と同じ意味にするため、注意やエラーには使わない |

- それぞれに `-light`（うすい地の色）と `-dark`（その上に置く文字の色）があります
- 白い文字をのせてよいのは `navi`・`purple`・`red` だけ。`yellow`・`pink`・`mint`・`orange` の上の文字は `ink` にします（読みやすさのため）
- 3分類：さんすう＝`navi`／りか＝`mint`／じょうほう＝`purple`

## 文字
| 用途 | フォント | 大きさの目安 |
|---|---|---|
| 見出し・数字・ボタン | Mochiy Pop One（`font-pop`） | 見出し 22〜30px、こたえの数 92px 以上 |
| 文・ふりがな | Zen Maru Gothic 700/900（`font-body`） | 本文 18px 以上、小さい注意書き 14〜15px |

- **22px 以上の文字の漢字には、すべてふりがなを振る**（`<ruby>回<rt>かい</rt></ruby>`）
- **それより小さい文字は、ひらがなで書く**（小さい文字のふりがなはつぶれて読めないため）
- 漢字は学年の漢字配当に合わせる（見本は5年生を想定）

## 形
- 線はいつも **3px の `ink`**
- 影はぼかさず、**下にずらした `ink`**（`shadow-pop` 6px／`-md` 5px／`-sm` 4px／`-xs` 3px）。押したら `translate-y` で沈めて影を消す
- 角丸はボタン 26px（`rounded-btn`）、カード 24px（`rounded-card`）
- タップできるものは高さ 44px 以上。メインボタンは 72px

## ナビの表情（`assets/navi/`）
- 線はUIとそろえて太くしてある：青い太線（ピタリだけ赤）＋白ぬり＋黒のふち＋下のかげ
- 小さく置いても顔が読めるよう、目と口を大きめにしてある（48px くらいまでは読める）
- `navi-*.png` は 480px 四方の透過 PNG。`svg/navi-*.svg` は同じ絵のベクター版（どの大きさでもくっきり。アプリではこちらを使うのがおすすめ）
- 7枚とも同じ範囲で切り出してあるので、表情を切り替えても体の位置はずれない

| ファイル | 表情 | 使う場面 |
|---|---|---|
| `navi-smile.png` | にこにこ | 案内・ホーム・なぞとき |
| `navi-think.png` | はてな | 「これは○○だね？」・自分で書く・もしも |
| `navi-blank.png` | ぽかん | ちがったとき・断られたとき |
| `navi-effort.png` | ぎゅっ | しらべ中（待ち時間）・予想するとき |
| `navi-shock.png` | 赤びっくり | **ピタリ** |
| `navi-shy.png` | 照れ | **おしい** |
| `navi-wow.png` | 青びっくり | **大はずれ**（「こんなに ちがうの！？」） |

## 部品の Tailwind レシピ
`tailwind-theme.css` を読み込んだ前提のクラスです。見本の HTML のインラインスタイルと同じ見た目になります。

```tsx
// メインボタン（青）
<button className="flex h-[72px] w-full items-center justify-center rounded-btn border-3 border-ink bg-navi font-pop text-2xl text-white shadow-pop active:translate-y-[6px] active:shadow-none">
  はてなを さがす！
</button>

// 「せーの！」ボタン（ピンク・文字は ink）
<button className="flex h-[76px] w-full items-center justify-center rounded-[28px] border-3 border-ink bg-pink font-pop text-[28px] text-ink shadow-pop active:translate-y-[6px] active:shadow-none">
  せーの！
</button>

// サブボタン（白）
<button className="flex h-14 items-center justify-center gap-2 rounded-[22px] border-3 border-ink bg-white text-lg font-black text-ink shadow-pop-sm">
  とりなおす
</button>

// ナビのふきだし（ナビ画像の右に置く。しっぽは回転した四角）
<div className="flex items-center gap-3">
  <img src="/navi/navi-smile.png" alt="ナビ" className="size-[88px] shrink-0" />
  <div className="relative grow rounded-card border-3 border-ink bg-white px-4 py-3 text-[21px] font-black leading-[1.75] shadow-pop-sm">
    <span className="absolute -left-[11px] top-[calc(50%-9px)] size-4 rotate-45 border-b-3 border-l-3 border-ink bg-white" />
    どの はてなが <ruby>気<rt>き</rt></ruby>になる？
  </div>
</div>

// 3択のカード（分類の色をうすく敷く）
<a className="flex items-center gap-3 rounded-card border-3 border-ink bg-purple-light p-3 text-ink shadow-pop-md">…</a>

// はんこ（答えのカードの右上に 12度かたむけて重ねる）：見本 14〜16 の <svg> をそのまま使う
```

## 画面と仕様の対応
| 見本 | 画面 | 仕様 |
|---|---|---|
| 00 | コンセプトボード | — |
| 01 | やくそく（起動・注意表示） | 02-spec 3章・F-16 |
| 02 | ログイン | 4章・F-09 |
| 03 | プロフィール作成 | 5章・F-10 |
| 04 | ホーム（今日のお題） | 1章・F-17 |
| 05 | さがす（撮影・撮影時の注意） | 6章・F-01・F-16 |
| 06 | つかまえる（囲む） | 7章・F-02 |
| 07 | つかまえた！（待ち・まめちしきクイズ） | 2章・03-technical 5.4 |
| 08 | これは○○だね？ | 8章・F-03 |
| 09 | ちがったとき | 8章・F-03 |
| 10・11 | はてなを えらぶ（3択）／かく | 9章・F-04 |
| 12・13 | せーの！（5年生から／4年生まで） | 10章・F-05 |
| 14〜16 | しょうたい：ピタリ／おしい／大はずれ | 11章・F-05・F-06 |
| 17 | なぞとき | 12章・F-06 |
| 18 | もしも | 13章・F-07 |
| 19 | はてなゲット！（保存・スタンプ・称号） | 14・16章・F-08・F-12 |
| 20 | はてなずかん | 14・16章・F-08・F-12 |
| 21 | みんなのはてな | 15章・F-14 |
| 22 | せってい | 9・5章・F-15・F-10 |

## アプリへの取り込み方（Issue #6 でひな形ができたあと）
1. `src/app/globals.css` で `@import "tailwindcss";` のあとに `tailwind-theme.css` を読み込む（コピーしてもよい）
2. フォントは Next.js に入っている `next/font/google` で `Mochiy_Pop_One` と `Zen_Maru_Gothic` を読み込み、`--font-pop` と `--font-body` に割り当てる
3. `assets/navi/svg/` の画像を `public/navi/` にコピーする（PNG でもよい）
4. 画面は見本の HTML を見ながら、上の「部品の Tailwind レシピ」で組み立てる（インラインスタイルの値はトークンと同じ）

## 見本の決まりごと（仮のもの）
- 写真の部分は、撮った写真の代わりに描いた絵（しんごう など）です
- 問いの例（しんごうは1日に何回赤になる？＝720回）は見た目の確認用です。実際の問い・式・答えは LLM と math.js が出します
- 数直線は、予想と答えに合わせて範囲を自動で決める**ふつうの目盛り**にしています（7倍のズレが見た目でも7倍の長さになるように）
- アプリ名：【未決】（コンセプトボードは「はてな採集アプリ（仮）」）
- 「はてなハンター」という呼び方、称号の名前（すうがく はかせ／りか マスター／エンジニアレベル）：仮
- 称号に必要なスタンプの数：【未決】（見本は5個）
- 4年生までの「5つの範囲から選ぶ」予想を、ピタリ／おしい／大はずれでどう判定するか：【未決】

## 見本にない画面
- 通信エラー・形式の崩れ・タイムアウト（09 と同じ形で、ナビ＝ぽかん＋やり直すボタン）
- 断られたとき「別のものを囲んでみてね」（09 と同じ形）
- 図鑑の詳細（条件調整・出典・本やサイトの紹介・関連する問い）
- ミッションページ（今日のお題。MVP の Should）
