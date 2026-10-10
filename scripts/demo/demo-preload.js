// 録画用preload。ステージ(main frame)には録画結果の保存口を、アプリ(iframe)には
// デモ用の時計・予定・Electron bridgeの代役を、アプリのスクリプトより先に差し込む。
const { ipcRenderer } = require("electron");

if (process.isMainFrame) {
  window.demoBridge = {
    save: (bytes) => ipcRenderer.invoke("demo-save", bytes),
    snap: (name) => ipcRenderer.invoke("demo-snap", name),
    log: (message) => ipcRenderer.invoke("demo-log", String(message)),
    done: () => ipcRenderer.invoke("demo-done"),
  };
} else {
  setUpAppFrame();
}

function setUpAppFrame() {
  const params = new URLSearchParams(location.search);
  const t0 = Number(params.get("t0"));
  const base = Number(params.get("base"));
  const slowRate = Number(params.get("slowRate")) || 1;

  // デモ用の時計。録画開始時に決めた時刻から進み、ゆっくリフレッシュ中だけ早送りする
  const RealDate = Date;
  let anchorReal = t0;
  let anchorFake = base;
  let rate = 1;
  const fakeNow = () => anchorFake + (RealDate.now() - anchorReal) * rate;
  const setRate = (nextRate) => {
    anchorFake = fakeNow();
    anchorReal = RealDate.now();
    rate = nextRate;
  };
  class DemoDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        super(fakeNow());
      } else {
        super(...args);
      }
    }

    static now() {
      return fakeNow();
    }
  }
  window.Date = DemoDate;

  const post = (message) => window.parent.postMessage({ source: "demo-app", ...message }, "*");

  localStorage.clear();
  localStorage.setItem("micro-slow-onboarded", "true");
  localStorage.setItem("micro-slow-source", "manual");
  localStorage.setItem(
    "micro-slow-events",
    JSON.stringify([
      { id: "manual-1", title: "週次レポートのまとめ", start: "09:00", duration: 50, source: "manual" },
      { id: "manual-2", title: "研究ミーティング", start: "10:00", duration: 60, source: "manual" },
      { id: "manual-3", title: "論文ゼミ", start: "13:00", duration: 60, source: "manual" },
      { id: "manual-4", title: "共同研究の打ち合わせ", start: "14:00", duration: 60, source: "manual" },
      { id: "manual-5", title: "展示の準備", start: "16:00", duration: 90, source: "manual" },
    ])
  );

  // 見せたい体験(周囲の音を聞く)が選ばれるよう、それ以外を直近履歴に入れておく
  let microSlows;
  Object.defineProperty(window, "MICRO_SLOWS", {
    configurable: true,
    get: () => microSlows,
    set: (value) => {
      microSlows = value;
      const recent = value.map((slow) => slow.id).filter((id) => id !== "listen-around");
      localStorage.setItem("micro-slow-recent-slows", JSON.stringify(recent));
    },
  });

  // Electron bridgeの代役。全画面化・非表示化はステージ側で演出する
  window.MicroSlowElectron = {
    isElectron: true,
    setReminders: async () => ({ scheduled: 0 }),
    showWindow: async () => {},
    enterSlowMode: () => {
      setRate(slowRate);
      post({ type: "enter" });
    },
    leaveSlowMode: () => {
      setRate(1);
      post({ type: "leave" });
    },
    loadGoogleEvents: async () => {
      throw new Error("Google Calendar is not used in the demo.");
    },
    clearGoogleAuth: async () => {},
    onStartSlow: (callback) => {
      window.__demoStartSlow = callback;
    },
  };

  // 録画ではスクロールバーを映さない
  document.addEventListener("DOMContentLoaded", () => {
    const style = document.createElement("style");
    style.textContent = "::-webkit-scrollbar { display: none; }";
    document.head.append(style);
  });

  window.addEventListener("message", (event) => {
    const message = event.data || {};
    if (message.source !== "demo-stage") return;

    if (message.type === "click") {
      document.querySelector(message.selector)?.click();
    }
    if (message.type === "scroll") {
      document.querySelector(message.selector)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (message.type === "key") {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: message.key, bubbles: true }));
    }
    if (message.type === "trigger") {
      window.__demoStartSlow?.(message.id);
    }
    if (message.type === "rect") {
      const rect = document.querySelector(message.selector)?.getBoundingClientRect();
      post({
        type: "rect",
        requestId: message.requestId,
        rect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
      });
    }
  });
}
