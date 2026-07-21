# Slow Index

Slow Indexは、予定前の短い余白にMicro Slowを差し込むElectronデスクトップアプリのプロトタイプです。

「遅くなれ」と促すのではなく、次の予定を妨げない範囲で、30秒から3分程度の感覚体験を提案します。

## Quick Start

```powershell
npm install
npm run electron
```

Electron版では、アプリがバックグラウンドに常駐し、予定5分前になるとウィンドウを表示してMicro Slowを開始します。

## Google Calendar連携

Google Calendar連携はElectron main processでOAuthを行います。外部ブラウザでGoogleログインを開き、localhostの一時callbackで認可コードを受け取ります。

Google Cloudでは、デスクトップアプリ用のOAuth Client IDを使います。共有用のClient IDは `config.js` に置きます。

```js
window.SLOW_INDEX_CONFIG = {
  googleClientId: "YOUR_DESKTOP_OAUTH_CLIENT_ID",
  googleCalendarId: "primary",
  upcomingWindowMinutes: 7,
};
```

Google Cloudのデスクトップアプリ用OAuth ClientにClient Secretが表示されている場合は、`config.local.js` にだけ追加します。

```js
window.SLOW_INDEX_CONFIG.googleClientSecret = "YOUR_DESKTOP_OAUTH_CLIENT_SECRET";
```

Client SecretはGitにコミットしません。

現在の実装は読み取り専用です。予定の作成・編集は行わず、`calendar.readonly` スコープで当日の予定だけを読み込みます。OAuth tokenはElectronのuserDataディレクトリに保存され、プロジェクトフォルダには保存されません。

## 現在の実装

- ダミー予定、手入力予定、Google Calendar予定の表示
- Google Calendar表示中の更新ボタンによる再同期
- Google Calendar 1時間ごとの自動同期
- 予定5分前のMicro Slow提案
- 予定5分前のウィンドウ前面表示とMicro Slow自動開始
- トレイ常駐
- ウィンドウを閉じても終了せず、非表示化
- 18種類のMicro Slow体験
- 直近に出たMicro Slowを避ける提案ロジック
- 数字カウントに依存しない円形の進行表示
- 完了後の移行画面と任意の色入力
- 最大提案回数、最大時間の設定UI

## ファイル構成

- `index.html`: 画面構造
- `styles.css`: UIスタイルとMicro Slow中の視覚表現
- `app.js`: renderer側の予定管理、提案生成、Micro Slow実行ロジック
- `electron-main.js`: Electron main process、常駐、最前面表示、Google OAuth、Calendar API読み込み
- `electron-preload.js`: Electron preload bridge
- `micro-slows.js`: アプリが読み込むMicro Slowデータ
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

Windows向けのzip配布物を作る場合は、Electron Forgeを使います。

```powershell
npm run make
```

成果物は `out/make/zip/win32/x64/` に出力されます。`config.local.js` は配布物に含めません。Google OAuth Client Secretなしで動作確認する場合は、ローカルの `config.local.js` にSecretを書かずにビルドしてください。

複数人で開発する場合は、最初に `CONTRIBUTING.md` を確認してください。

## Micro Slowの考え方

このプロトタイプでは、Slownessを単なる遅さではなく、自己のリズムと周囲とのズレが少ない状態として扱います。

Micro Slowは、予定の前に短い感覚体験を置くことで、焦りや通知反応から一時的に離れ、現在の身体感覚へ戻るための入口です。

## まだやっていないこと

- Electron版の配布用ビルド、署名、インストーラー
- OS起動時の自動起動設定UI
- 予定種別ごとのMicro Slow最適化
- ユーザータイプ分類
- スコア、ランキング、連続記録
- 詳細な振り返り日記
- 展示用モード
