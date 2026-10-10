// 展示用デモ動画の録画スクリプト。
// stage.html(作業中のデスクトップを模した画面)の中でアプリをiframeとして動かし、その画面自体をMediaRecorderで録画する。
// 実行: npm run demo:record(操作デモ) / npm run demo:concept(体験前に見せるコンセプト動画)
//       npm run demo:concept-short(コンセプト動画の短い版)
// 出力: out/demo/ の micro-slow-demo.mp4 / micro-slow-concept.mp4 / micro-slow-concept-short.mp4
const path = require("path");
const fs = require("fs");
const os = require("os");
const { app, BrowserWindow, ipcMain, session } = require("electron");

const projectRoot = path.join(__dirname, "..", "..");
const argValue = (name) => {
  const arg = process.argv.find((item) => item.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3) : null;
};
const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;
// 1280x720の画面を1.5倍の密度で描画する(録画結果はstage.js側で1920x1080にそろえる)
const SCALE = 1.5;

const videos = {
  demo: { stage: "stage.html", out: "micro-slow-demo.mp4" },
  concept: { stage: "concept.html", out: "micro-slow-concept.mp4" },
  "concept-short": { stage: "concept.html", query: { variant: "short" }, out: "micro-slow-concept-short.mp4" },
};
const video = videos[argValue("video") || "demo"];
if (!video) {
  throw new Error(`Unknown --video. Use one of: ${Object.keys(videos).join(", ")}`);
}
const outPath = argValue("out") || path.join(projectRoot, "out", "demo", video.out);
const snapDir = argValue("snaps");

app.commandLine.appendSwitch("force-device-scale-factor", String(SCALE));
// 実アプリのlocalStorageやOAuth tokenに触れないよう、録画専用の一時userDataを使う
const userDataDir = path.join(os.tmpdir(), "micro-slow-demo-recorder");
fs.rmSync(userDataDir, { recursive: true, force: true });
app.setPath("userData", userDataDir);

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
    useContentSize: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    backgroundColor: "#000000",
    webPreferences: {
      preload: path.join(__dirname, "demo-preload.js"),
      contextIsolation: false,
      sandbox: false,
      nodeIntegrationInSubFrames: true,
      backgroundThrottling: false,
    },
  });
  win.setContentSize(STAGE_WIDTH, STAGE_HEIGHT);
  win.center();

  // ステージ自身のフレームを録画対象にする(デスクトップ全体は映さない)
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    callback({ video: request.frame });
  });

  ipcMain.handle("demo-save", (_event, bytes) => {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, Buffer.from(bytes));
    console.log(`saved ${outPath} (${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB)`);
  });

  ipcMain.handle("demo-snap", async (_event, name) => {
    if (!snapDir) return;
    const image = await win.webContents.capturePage();
    fs.mkdirSync(snapDir, { recursive: true });
    fs.writeFileSync(path.join(snapDir, `${name}.png`), image.toPNG());
  });

  ipcMain.handle("demo-log", (_event, message) => {
    console.log(message);
  });

  ipcMain.handle("demo-done", () => {
    app.quit();
  });

  win.loadFile(path.join(__dirname, video.stage), { query: video.query || {} });
  win.webContents.once("did-finish-load", () => {
    // getDisplayMediaはユーザー操作を要求するため、ユーザー操作扱いで録画を始める
    win.webContents.executeJavaScript("window.startDemo()", true).catch((error) => {
      console.error(error);
      app.exit(1);
    });
  });
});
