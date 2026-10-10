// デモの進行台本。録画開始(t0)からの経過秒で場面を進める。
const SLOW_RATE = 5; // ゆっくリフレッシュ中の早送り倍率(60秒の体験を12秒で見せる)
const AUTO_START_AT = 29; // 録画開始から何秒後に「予定5分前(9:55)」になるか

const appWindow = document.querySelector("#appWindow");
const appFrame = document.querySelector("#appFrame");
const caption = document.querySelector("#caption");
const cursor = document.querySelector("#cursor");
const titleCard = document.querySelector("#titleCard");
const clock = document.querySelector("#clock");
const workText = document.querySelector("#workText");
const toast = document.querySelector("#toast");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const snap = (name) => window.demoBridge?.snap(name);

let t0 = 0;
const elapsed = () => (Date.now() - t0) / 1000;
const until = (seconds) => sleep(Math.max(seconds - elapsed(), 0) * 1000);

// アプリ側と同じ規則で進むデモの時計(タスクバー表示用)
const clockState = { anchorReal: 0, anchorFake: 0, rate: 1 };
const fakeNow = () => clockState.anchorFake + (Date.now() - clockState.anchorReal) * clockState.rate;
const setClockRate = (rate) => {
  clockState.anchorFake = fakeNow();
  clockState.anchorReal = Date.now();
  clockState.rate = rate;
};

function renderClock() {
  const now = new Date(fakeNow());
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
  const date = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
  clock.innerHTML = `${time}<small>${date}</small>`;
}

// 字幕
async function showCaption(text, { onSlow = false } = {}) {
  if (caption.classList.contains("show")) {
    caption.classList.remove("show");
    await sleep(450);
  }
  caption.innerHTML = text;
  caption.classList.toggle("on-slow", onSlow);
  caption.classList.add("show");
}

function hideCaption() {
  caption.classList.remove("show");
}

// アプリとのやりとり
const appFrameMessage = (message) => appFrame.contentWindow.postMessage({ source: "demo-stage", ...message }, "*");
let rectRequestId = 0;
const rectWaiters = new Map();
const appEvents = { enter: [], leave: [] };

window.addEventListener("message", (event) => {
  const message = event.data || {};
  if (message.source !== "demo-app") return;
  if (message.type === "rect") {
    rectWaiters.get(message.requestId)?.(message.rect);
    rectWaiters.delete(message.requestId);
  }
  if (message.type === "enter") enterSlowMode();
  if (message.type === "leave") leaveSlowMode();
});

function appRect(selector) {
  rectRequestId += 1;
  const requestId = rectRequestId;
  appFrameMessage({ type: "rect", selector, requestId });
  return new Promise((resolve) => rectWaiters.set(requestId, resolve));
}

// ステージ座標で、アプリ内の要素の中心を返す
async function appPoint(selector) {
  const rect = await appRect(selector);
  if (!rect) throw new Error(`Element not found in app: ${selector}`);
  const frameRect = appFrame.getBoundingClientRect();
  return { x: frameRect.left + rect.x + rect.width / 2, y: frameRect.top + rect.y + rect.height / 2 };
}

function waitFor(type) {
  return new Promise((resolve) => appEvents[type].push(resolve));
}

// 自動開始時の全画面化(実アプリのenterSlowModeと同じく、透明から0.5秒でふわっと出す)
function enterSlowMode() {
  setClockRate(SLOW_RATE);
  hideCaption();
  cursor.classList.remove("show");
  appWindow.style.transition = "none";
  appWindow.style.opacity = "0";
  appWindow.classList.remove("closed");
  appWindow.classList.add("fullscreen");
  void appWindow.offsetWidth;
  appWindow.style.transition = "opacity 500ms linear";
  appWindow.style.opacity = "1";
  appEvents.enter.splice(0).forEach((resolve) => resolve());
}

// 色を選んだ後の非表示化(実アプリのleaveSlowModeと同じく0.4秒で消える)
function leaveSlowMode() {
  setClockRate(1);
  appWindow.style.transition = "opacity 400ms linear";
  appWindow.style.opacity = "0";
  setTimeout(() => {
    appWindow.style.transition = "none";
    appWindow.classList.remove("fullscreen");
    appWindow.classList.add("closed");
    appWindow.style.opacity = "";
    appEvents.leave.splice(0).forEach((resolve) => resolve());
  }, 420);
}

// カーソル
let cursorPos = { x: 1180, y: 560 };
function placeCursor(point) {
  cursorPos = point;
  cursor.style.transform = `translate(${point.x - 4}px, ${point.y - 2}px)`;
}

async function moveCursor(point, ms = 900) {
  cursor.style.transition = `opacity 300ms ease, transform ${ms}ms cubic-bezier(0.45, 0, 0.2, 1)`;
  placeCursor(point);
  await sleep(ms);
}

async function clickAt(point) {
  const ring = document.createElement("span");
  ring.className = "click-ring";
  ring.style.left = `${point.x}px`;
  ring.style.top = `${point.y}px`;
  document.body.append(ring);
  setTimeout(() => ring.remove(), 700);
  await sleep(120);
}

// 作業中の入力
const workLines = [
  "・展示ブースの配置を確認する",
  "・説明パネルの文言を短くする",
  "・来場者アンケートの項目を3つに絞る",
  "・",
];
async function typeWork(untilSeconds) {
  const full = workLines.join("\n");
  let index = 0;
  while (elapsed() < untilSeconds && index < full.length) {
    index += 1;
    workText.innerHTML = `${full.slice(0, index).replace(/</g, "&lt;")}<span class="caret"></span>`;
    await sleep(full[index - 1] === "\n" ? 500 : 110 + Math.random() * 90);
  }
}

async function runTimeline() {
  // 0〜4秒: タイトル
  // 録画の立ち上がり待ち(約2秒)のあとでもタイトルが3秒ほど映るようにする
  await until(5);
  titleCard.classList.add("hide");

  // 5〜19秒: 今日の予定
  await until(6);
  appFrameMessage({ type: "scroll", selector: ".calendar-event" });
  await showCaption("今日の予定から、それぞれの5分前に余白をつくります");
  snap("01-calendar");

  await until(9);
  cursor.classList.add("show");
  await moveCursor(await appPoint('button[data-action="toggle-auto"][data-id="manual-5"]'));
  await showCaption("予定ごとに「届く」「見送る」を切り替えられます");
  await sleep(500);
  await clickAt(cursorPos);
  appFrameMessage({ type: "click", selector: 'button[data-action="toggle-auto"][data-id="manual-5"]' });
  await sleep(600);
  snap("02-dismissed");

  await until(13.5);
  await moveCursor(await appPoint('button[data-action="toggle-auto"][data-id="manual-4"]'));
  await showCaption("前の予定が続いているときは「余白少」<br>手動で届けることもできます");
  snap("03-no-space");

  await until(18);
  const closeRect = document.querySelector("#appClose").getBoundingClientRect();
  await moveCursor({ x: closeRect.left + closeRect.width / 2, y: closeRect.top + closeRect.height / 2 }, 700);
  await clickAt(cursorPos);
  appWindow.classList.add("closed");
  await showCaption("ウィンドウを閉じても、常駐して待っています");
  await moveCursor({ x: 520, y: 470 }, 900);
  cursor.classList.remove("show");

  // 20〜29秒: 作業中
  await until(21.5);
  hideCaption();
  const typing = typeWork(AUTO_START_AT + 1);
  await until(23);
  toast.classList.add("show");
  await until(26.5);
  toast.classList.remove("show");
  await showCaption("10:00 の研究ミーティングまで、あと5分");
  snap("04-working");

  // 30秒前後: 自動開始(アプリ自身の判定で開始する。万一取りこぼしたら外部トリガーで開始)
  let slowEntered = false;
  const entered = waitFor("enter").then(() => (slowEntered = true));
  until(AUTO_START_AT + 3).then(() => {
    if (slowEntered) return;
    log("auto-start fallback trigger");
    appFrameMessage({ type: "trigger", id: "manual-2" });
  });
  await entered;
  log(`slow started at ${elapsed().toFixed(1)}s`);
  const slowStartedAt = elapsed();
  await typing;

  await sleep(3500);
  snap("05-slow");
  await showCaption("霧が満ちたら終わり<small>(デモのため早送り)</small>", { onSlow: true });
  await sleep(4500);
  hideCaption();
  await until(slowStartedAt + 60 / SLOW_RATE - 1);
  snap("06-mist");

  // 色を選んで、元の作業へ戻る
  const left = waitFor("leave");
  await until(slowStartedAt + 60 / SLOW_RATE + 4.6);
  snap("07-color");
  appFrameMessage({ type: "click", selector: '.sense-button[data-sense="green"]' });
  await left;
  log(`slow left at ${elapsed().toFixed(1)}s`);

  await sleep(600);
  await showCaption("そして、次の予定へ");
  snap("08-back");
  await sleep(3800);
  hideCaption();
  await sleep(600);
  titleCard.classList.remove("hide");
  await sleep(2600);
}

window.startDemo = async () => {
  t0 = Date.now();
  const base = new Date();
  base.setHours(9, 55, 0, 0);
  const baseMs = base.getTime() - AUTO_START_AT * 1000;
  clockState.anchorReal = t0;
  clockState.anchorFake = baseMs;
  renderClock();
  setInterval(renderClock, 250);
  placeCursor(cursorPos);

  appFrame.src = `../../index.html?t0=${t0}&base=${baseMs}&slowRate=${SLOW_RATE}`;
  await new Promise((resolve) => appFrame.addEventListener("load", resolve, { once: true }));

  const stopRecording = await window.startRecording();
  try {
    await runTimeline();
  } catch (error) {
    log(`timeline failed: ${error.stack || error}`);
  }
  await stopRecording();
  await window.demoBridge.done();
};
