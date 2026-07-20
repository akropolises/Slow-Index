# Slow Index

Fastな生活リズムを持つ人に向けて、予定前の短い余白にMicro Slowを差し込むプロトタイプです。

「遅くなれ」と促すのではなく、次の予定を妨げない範囲で、30秒から3分程度の感覚体験を提案します。

## 使い方

ローカルサーバーで起動します。

```powershell
npm start
```

PC上では以下を開きます。

```text
http://127.0.0.1:8000/
```

スマホから確認する場合は、PCとスマホを同じWi-Fiにつなぎ、PCのIPアドレスで開きます。

```text
http://<PCのIPアドレス>:8000/
```

通常のデモ表示だけなら依存パッケージは不要です。ブラウザを閉じた状態のWeb Push通知を試す場合は依存パッケージをインストールします。

```powershell
npm install
```

## 開発

構文チェックを実行します。

```powershell
npm run check
```

複数人で開発する場合は、最初に `CONTRIBUTING.md` を確認してください。

Google Calendar連携に使う個人のOAuth Client IDは `config.local.js` に置きます。`config.local.js` はGit管理しません。

```powershell
Copy-Item config.example.js config.local.js
```

## 現在の実装

- ダミーカレンダー予定の表示
- Google Calendarの予定読み込み
- 手入力による予定追加
- カレンダー風タイムラインから予定を選んでMicro Slowを開始
- 予定5分前のMicro Slow候補表示
- ページを開いている状態で予定5分前になったときのMicro Slow自動開始
- ページを閉じた状態で予定5分前になったときのWeb Push通知
- 通知クリックからSlow Indexを開いてMicro Slow開始
- 現在予定がなく、もうすぐ始まる予定がある場合のMicro Slow提案
- 「今回はしない」の除外操作
- 18種類のMicro Slow体験
- 直近に出たMicro Slowを避ける提案ロジック
- 数字カウントに依存しない円形の進行表示
- 終了ボタン
- 完了後の移行画面
- 任意の色による感覚入力
- 最大提案回数、最大時間の設定

## データ管理

Micro Slowの実行時データは `micro-slows.js` を正本とします。

`micro-slows.md` は一覧確認と編集方針のためのドキュメントです。Micro Slowを追加・修正する場合は、まず `micro-slows.js` を更新し、必要に応じて `micro-slows.md` も同じ内容に揃えます。

## Google Calendar連携

Google Calendarを読むには、Google CloudでOAuth Client IDを作成し、`config.local.js` に設定します。

```js
window.SLOW_INDEX_CONFIG = {
  googleClientId: "YOUR_GOOGLE_OAUTH_CLIENT_ID",
  googleCalendarId: "primary",
  upcomingWindowMinutes: 7,
  pushPublicKey: "YOUR_VAPID_PUBLIC_KEY",
};
```

`config.js` は共有用の既定設定です。個人のClient IDや検証用Calendar IDは `config.local.js` で上書きしてください。

Google Cloud側では、JavaScript originに起動中のURLを登録します。

例:

```text
http://localhost:8000
http://127.0.0.1:8000
http://<PCのIPアドレス>:8000
```

`npm start` が `8001` など別ポートで起動した場合は、そのポートのURLも追加してください。

現在の実装では予定の作成・編集は行わず、`calendar.readonly` スコープで予定の読み込みだけを行います。

初回起動時は「Google Calendarと連携」画面が表示されます。連携せずに試す場合は「デモで見る」を選びます。

初回画面をもう一度見たい場合は、ブラウザの開発者ツールなどからLocal Storageの `slow-index-onboarded` を削除してください。

## ファイル構成

- `index.html`: 画面構造
- `styles.css`: UIスタイルとMicro Slow中の視覚表現
- `micro-slows.js`: アプリが読み込むMicro Slowデータ
- `app.js`: 予定管理、提案生成、Micro Slow実行ロジック
- `sw.js`: 通知クリック時の復帰処理
- `manifest.webmanifest`: PWAメタデータ
- `config.js`: 共有用の既定設定
- `config.example.js`: 個人設定ファイルのひな形
- `CONTRIBUTING.md`: 複数人開発の手順
- `micro-slows.md`: Micro Slow一覧と編集方針
- `requirements.md`: システム要件
- `concept.md`: コンセプト
- `idea.md`: アイデア詳細
- `疑問点.md`: 論点と回答
- `zakki.md`: 初期メモ

## Micro Slowの考え方

このプロトタイプでは、Slownessを単なる遅さではなく、自己のリズムと周囲とのズレが少ない状態として扱います。

Micro Slowは、予定の前に短い感覚体験を置くことで、焦りや通知反応から一時的に離れ、現在の身体感覚へ戻るための入口です。

## 通知の制約

Slow Indexのページが開かれている間は、予定5分前を検知すると通知を出さずにMicro Slowを直接開始します。

ページを閉じた状態で通知するには、Web Push対応サーバーを起動します。

```powershell
npm install
npx web-push generate-vapid-keys
```

生成された鍵を環境変数に設定し、`config.local.js` に公開鍵を入れます。

```powershell
$env:VAPID_PUBLIC_KEY="YOUR_VAPID_PUBLIC_KEY"
$env:VAPID_PRIVATE_KEY="YOUR_VAPID_PRIVATE_KEY"
$env:VAPID_SUBJECT="mailto:your-email@example.com"
npm run start:push
```

`config.local.js`:

```js
window.SLOW_INDEX_CONFIG.pushPublicKey = "YOUR_VAPID_PUBLIC_KEY";
```

Web Push通知をクリックすると、既存のSlow Indexタブを前面に戻すか、新しく開いてMicro Slowを開始します。

通知を使う場合は、以下のどちらかで開いてください。

```text
http://127.0.0.1:8000/
http://localhost:8000/
```

`http://<PCのIPアドレス>:8000/` はスマホ実機確認には使えますが、HTTPSではないため、Service Workerや通知が使えない場合があります。

通知が来ない場合は、設定画面の「テスト通知」を押してOSの通知欄に出るか確認してください。出ない場合は、ブラウザまたはOS側でSlow Indexの通知がブロックされています。

Web Push通知はPushサーバーが起動している間だけ送られます。予定はページを開いたとき、Google Calendarを読み込んだとき、または手入力予定を追加したときにPushサーバーへ登録されます。

## 初期版でやっていないこと

- Pushサーバーをクラウドに置いた常時稼働
- 予定種別ごとのMicro Slow最適化
- ユーザータイプ分類
- スコア、ランキング、連続記録
- 詳細な振り返り日記

## 次の実装候補

- 通知機能
- 予定種別に応じた提案内容の変更
- Google Calendarの予定クリックからMicro Slowへ移る導線の本実装
- スマートフォン実機での表示確認
- 展示用モードの追加
