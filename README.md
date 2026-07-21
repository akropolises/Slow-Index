# Slow Index

Slow Indexは、予定前の短い余白にMicro Slowを差し込むプロトタイプです。

「遅くなれ」と促すのではなく、次の予定を妨げない範囲で、30秒から3分程度の感覚体験を提案します。

## Quick Start

通常のデモ表示は依存パッケージなしで起動できます。

```powershell
npm start
```

ブラウザで開きます。

```text
http://127.0.0.1:8000/
```

`index.html` を直接開く `file://` では、Service Worker、通知、Google Calendar連携が正常に動きません。

## Web Pushを使う場合

ページを閉じた状態でも通知を受けるには、Web Push対応サーバーを使います。

```powershell
npm install
npx web-push generate-vapid-keys
```

生成された鍵を環境変数に設定します。

```powershell
$env:VAPID_PUBLIC_KEY="YOUR_VAPID_PUBLIC_KEY"
$env:VAPID_PRIVATE_KEY="YOUR_VAPID_PRIVATE_KEY"
$env:VAPID_SUBJECT="mailto:your-email@example.com"
npm run start:push
```

`config.local.js` に公開鍵だけを書きます。

```js
window.SLOW_INDEX_CONFIG.pushPublicKey = "YOUR_VAPID_PUBLIC_KEY";
```

Private KeyはGitや `config.local.js` に入れず、環境変数だけで扱ってください。

## Electronデスクトップ版

通知ではなく、時刻になったらSlow Indexウィンドウを前面に出す実験版です。

```powershell
npm install
npm run electron
```

Electron版では、renderer側の予定情報をmain processへ渡し、main processが予定5分前のタイマーを管理します。時刻になるとウィンドウを表示し、一時的に最前面へ出して対象のMicro Slowを開始します。

Google Calendar連携はElectron main processでOAuthを行います。外部ブラウザでGoogleログインを開き、localhostの一時callbackで認可コードを受け取ります。Google CloudではWeb用ではなく、デスクトップアプリ用のOAuth Client IDを使ってください。

現時点では実験用の最小実装です。

- トレイ常駐に対応
- ウィンドウを閉じても終了せず、非表示になる
- 予定5分前にウィンドウを表示してMicro Slow開始
- OS起動時の自動起動はまだ無効
- インストーラー化、コード署名、配布用ビルドは未対応
- Electron版ではWeb Push通知は使わない

## Google Calendar連携

Google Calendarを読むには、Google CloudでOAuth Client IDを作成し、`config.local.js` に設定します。

```js
window.SLOW_INDEX_CONFIG.googleClientId = "YOUR_GOOGLE_OAUTH_CLIENT_ID";
window.SLOW_INDEX_CONFIG.googleCalendarId = "primary";
```

Web版では「ウェブアプリケーション」用Client IDを使い、Electron版では「デスクトップアプリ」用Client IDを使います。

Electron版でログイン後に読み込み失敗する場合は、`config.js` のClient IDがGoogle Cloudで「デスクトップアプリ」として作られているか確認してください。「ウェブアプリケーション」用Client IDをElectron版に使うと、認可後のtoken交換で失敗します。

Google Cloud側では、JavaScript originに実際に開くURLを登録します。

```text
http://localhost:8000
http://127.0.0.1:8000
```

現在の実装は読み取り専用です。予定の作成・編集は行わず、`calendar.readonly` スコープで当日の予定だけを読み込みます。

Electron版のGoogle OAuth tokenは、ElectronのuserDataディレクトリに保存されます。Git管理されるプロジェクトフォルダには保存しません。

## 現在の実装

- ダミー予定、手入力予定、Google Calendar予定の表示
- 予定5分前のMicro Slow提案
- ページを開いている状態でのMicro Slow自動開始
- ページを閉じた状態でのWeb Push通知
- 通知クリックからSlow Indexを開いてMicro Slow開始
- Electron版での常駐と最前面Micro Slow開始
- Electron main processでのGoogle Calendar OAuth
- 通知クリック時の二重開始防止
- 18種類のMicro Slow体験
- 直近に出たMicro Slowを避ける提案ロジック
- 数字カウントに依存しない円形の進行表示
- 完了後の移行画面と任意の色入力
- 最大提案回数、最大時間の設定UI

## 通知の挙動

ページが開いている場合:

- 予定5分前にページ側でMicro Slowを直接開始します。
- Push通知も届く場合があります。
- すでにMicro Slowが始まっている場合、通知をクリックしても二重開始しません。

ページを閉じている場合:

- Pushサーバーが予定5分前にWeb Push通知を送ります。
- 通知をクリックするとSlow Indexを開き、対象のMicro Slowを開始します。

Chrome自体を完全に終了した状態で通知が届くかは、OSとChromeのバックグラウンド実行設定に依存します。Chromeの設定で「Google Chrome を閉じた際にバックグラウンド アプリの処理を続行する」が無効だと、ブラウザ終了中のPush通知は届かない場合があります。

通知を使う場合は、以下のどちらかで開いてください。

```text
http://127.0.0.1:8000/
http://localhost:8000/
```

`http://<PCのIPアドレス>:8000/` はスマホ実機確認には使えますが、HTTPSではないため、Service Workerや通知が使えない場合があります。

## 設定ファイル

共有設定は `config.js` に置きます。個人のOAuth Client IDやVAPID Public Keyは `config.local.js` に置きます。

```js
window.SLOW_INDEX_CONFIG.googleClientId = "YOUR_GOOGLE_OAUTH_CLIENT_ID";
window.SLOW_INDEX_CONFIG.googleCalendarId = "primary";
window.SLOW_INDEX_CONFIG.pushPublicKey = "YOUR_VAPID_PUBLIC_KEY";
```

`config.local.js` は `.gitignore` で除外されています。

## ファイル構成

- `index.html`: 画面構造
- `styles.css`: UIスタイルとMicro Slow中の視覚表現
- `app.js`: 予定管理、提案生成、Micro Slow実行ロジック
- `micro-slows.js`: アプリが読み込むMicro Slowデータ
- `google-calendar.js`: Google Calendar読み込み
- `sw.js`: Push受信と通知クリック時の復帰処理
- `push-server.js`: ローカルWeb Pushサーバー
- `electron-main.js`: Electron main process
- `electron-preload.js`: Electron preload bridge
- `manifest.webmanifest`: PWAメタデータ
- `config.js`: 共有用の既定設定
- `config.example.js`: 個人設定ファイルのひな形
- `CONTRIBUTING.md`: 複数人開発の手順
- `requirements.md`: 要件と実装状態
- `micro-slows.md`: Micro Slow一覧と編集方針

## 開発

構文チェックを実行します。

```powershell
npm run check
```

複数人で開発する場合は、最初に `CONTRIBUTING.md` を確認してください。

## Micro Slowの考え方

このプロトタイプでは、Slownessを単なる遅さではなく、自己のリズムと周囲とのズレが少ない状態として扱います。

Micro Slowは、予定の前に短い感覚体験を置くことで、焦りや通知反応から一時的に離れ、現在の身体感覚へ戻るための入口です。

## まだやっていないこと

- Pushサーバーのクラウド常時稼働
- Electron版の配布用ビルド、署名、インストーラー
- OS起動時の自動起動設定UI
- 予定種別ごとのMicro Slow最適化
- ユーザータイプ分類
- スコア、ランキング、連続記録
- 詳細な振り返り日記
- 展示用モード
