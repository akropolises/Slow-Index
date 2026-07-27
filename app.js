const microSlows = window.MICRO_SLOWS;
const appConfig = window.MICRO_SLOW_CONFIG || window.SLOW_INDEX_CONFIG || {};
const desktop = window.MicroSlowElectron || window.SlowIndexElectron;
const storageKeys = {
  source: "micro-slow-source",
  events: "micro-slow-events",
  onboarded: "micro-slow-onboarded",
  recentSlows: "micro-slow-recent-slows",
  artwork: "micro-slow-artwork",
};

// デモ用に固定で用意したキャンバスの履歴。どのマシンで開いてもカレンダーが同じ見た目になるよう、
// localStorageに依存せずコードに直接埋め込む(readArtworkStateで既存のhistoryにマージされる)。
// 2026-07-24と2026-07-25の分はAI対話(DIALOGUES)と対になっているため、値を変えないこと。
const DEMO_HISTORY = {
  "2026-07-14": [
    { color: "blue", x: 0.9208937276144674, y: 0.7597977933918486, size: 88.54445686126468 },
    { color: "rose", x: 0.7905899743860655, y: 0.8756742453198244, size: 50.14629085738713 },
  ],
  "2026-07-15": [
    { color: "rose", x: 0.8082849303123585, y: 0.06473363447630576, size: 56.54554109119813 },
    { color: "gold", x: 0.6705588592375983, y: 0.5338498729366153, size: 69.42038345224093 },
    { color: "rose", x: 0.09537504392007279, y: 0.15117849404963046, size: 51.13363827681991 },
    { color: "green", x: 0.16027490397782718, y: 0.05299918305405471, size: 74.04108776583716 },
  ],
  "2026-07-16": [
    { color: "gold", x: 0.15228039832572893, y: 0.4627245972372689, size: 77.81624876087717 },
    { color: "gold", x: 0.6803934742397488, y: 0.854598339308988, size: 66.64430671589129 },
    { color: "gold", x: 0.37043040562776997, y: 0.11276472888085798, size: 55.96656227027712 },
    { color: "gold", x: 0.5939235195085057, y: 0.7237189630415971, size: 74.13806849975225 },
    { color: "gold", x: 0.31837493812655515, y: 0.37515967916023496, size: 80.80459022972775 },
    { color: "rose", x: 0.4938263250018179, y: 0.9635539873052452, size: 45.36905747662755 },
  ],
  "2026-07-17": [
    { color: "green", x: 0.9513545939965046, y: 0.6073562074825947, size: 83.87521614013278 },
    { color: "gold", x: 0.684582120510281, y: 0.8162214133817004, size: 66.20122515840217 },
  ],
  "2026-07-18": [
    { color: "gold", x: 0.0351957958484711, y: 0.35560611483950777, size: 64.62120342936615 },
    { color: "rose", x: 0.13663801440501977, y: 0.4395469470368053, size: 51.69528920638977 },
  ],
  "2026-07-19": [
    { color: "gold", x: 0.6663268828816792, y: 0.5666213833116523, size: 44.8856121133168 },
    { color: "green", x: 0.8134480823013821, y: 0.4606570872850284, size: 85.50719710112827 },
    { color: "rose", x: 0.1837041297432307, y: 0.7375108128793482, size: 48.99358615840438 },
    { color: "rose", x: 0.7658683332285972, y: 0.6688720868437398, size: 84.83348138970504 },
    { color: "blue", x: 0.8699787797858817, y: 0.5254878256061162, size: 57.471357025777166 },
  ],
  "2026-07-20": [
    { color: "gold", x: 0.4462136655859207, y: 0.7446815193422754, size: 67.93765815497659 },
    { color: "blue", x: 0.8387856166454496, y: 0.3301209958533946, size: 58.11590713886942 },
    { color: "gold", x: 0.604520221321762, y: 0.01856336769035627, size: 42.23249435870954 },
    { color: "green", x: 0.6281419301339424, y: 0.0666528348948402, size: 59.969370356218825 },
  ],
  "2026-07-21": [
    { color: "rose", x: 0.3706168474959437, y: 0.2361979441486537, size: 45.66182880787493 },
    { color: "rose", x: 0.7420392017035963, y: 0.5394775694772959, size: 60.98149882589875 },
    { color: "gold", x: 0.8781209006936965, y: 0.7496125767840424, size: 85.03912312207203 },
  ],
  "2026-07-22": [
    { color: "blue", x: 0.617975694469442, y: 0.6196727297523015, size: 47.18493541596349 },
    { color: "gold", x: 0.4557530378175745, y: 0.9861903400045997, size: 88.05941924944204 },
    { color: "gold", x: 0.23302875060014638, y: 0.7653294675133655, size: 61.995646329518344 },
    { color: "rose", x: 0.835221599088727, y: 0.21907791439356972, size: 82.91652118816768 },
    { color: "green", x: 0.44933864477759033, y: 0.3727204775865366, size: 40.11727314367206 },
    { color: "green", x: 0.21005652010983333, y: 0.7249682578729708, size: 83.5888787429856 },
  ],
  "2026-07-23": [
    { color: "gold", x: 0.09320144410600295, y: 0.11004684216636362, size: 40.039994619551834 },
    { color: "green", x: 0.6611964376544854, y: 0.5295006268563434, size: 56.39761613217602 },
    { color: "gold", x: 0.07356643811838581, y: 0.15709053668398731, size: 76.83814575694767 },
    { color: "gold", x: 0.8653794252745831, y: 0.6880308201183798, size: 88.13570668874303 },
    { color: "blue", x: 0.1719338155226725, y: 0.8233627886731358, size: 66.60715340405622 },
  ],
  "2026-07-24": [
    { color: "blue", x: 0.27249727633164667, y: 0.8188179554124205, size: 50.73048514437753 },
    { color: "green", x: 0.04350217833476633, y: 0.3450273981240899, size: 47.4527939570617 },
    { color: "blue", x: 0.3617015037720739, y: 0.33619852396643435, size: 72.7874762434532 },
  ],
  "2026-07-25": [
    { color: "green", x: 0.3853407092319024, y: 0.39385616897767495, size: 89.40558654709454 },
    { color: "green", x: 0.3640016761938065, y: 0.5826895557436498, size: 83.96759053151378 },
    { color: "green", x: 0.27187794738740806, y: 0.6643250761045146, size: 45.49048458502317 },
    { color: "green", x: 0.7406943622734677, y: 0.6269975257315061, size: 61.071573205227736 },
    { color: "green", x: 0.6195540966347962, y: 0.6622053469701223, size: 70.14993959438915 },
    { color: "gold", x: 0.5213555590533594, y: 0.4189559698582397, size: 88.03528395990496 },
    { color: "gold", x: 0.6145663430308057, y: 0.509857341961123, size: 50.0664282430193 },
    { color: "gold", x: 0.5871776473411436, y: 0.591271312753027, size: 48.36675857913927 },
    { color: "gold", x: 0.35668366809903845, y: 0.3823651896593779, size: 63.08323735028455 },
  ],
};

// 出口で選べる感覚色と、キャンバスの滲み描画に使う実際のRGB値の対応表
const senseColorHex = {
  green: "#6f9f89",
  gold: "#d7a447",
  blue: "#668ca8",
  rose: "#c96f61",
};
const legacyStorageKeys = {
  source: "slow-index-source",
  events: "slow-index-events",
  onboarded: "slow-index-onboarded",
  recentSlows: "slow-index-recent-slows",
};

function migrateStorageKey(nextKey, legacyKey) {
  if (localStorage.getItem(nextKey) !== null || localStorage.getItem(legacyKey) === null) {
    return;
  }
  localStorage.setItem(nextKey, localStorage.getItem(legacyKey));
}

migrateStorageKey(storageKeys.source, legacyStorageKeys.source);
migrateStorageKey(storageKeys.events, legacyStorageKeys.events);
migrateStorageKey(storageKeys.onboarded, legacyStorageKeys.onboarded);
migrateStorageKey(storageKeys.recentSlows, legacyStorageKeys.recentSlows);

const storedSource = localStorage.getItem(storageKeys.source);
const storedEvents = readStoredEvents() || [];
const runtimeEvents = storedEvents.filter((event) => event.source !== "sample");
if (runtimeEvents.length !== storedEvents.length) {
  localStorage.setItem(storageKeys.events, JSON.stringify(runtimeEvents));
}

const state = {
  source: storedSource === "manual" ? "manual" : "google",
  events: runtimeEvents,
  dismissed: new Set(),
  recentSlowIds: readRecentSlowIds(),
  onboarded: localStorage.getItem(storageKeys.onboarded) === "true",
  currentProposal: null,
  currentSlow: null,
  timer: null,
  transitionTimer: null,
  schedulerTimer: null,
  googleSyncTimer: null,
  startedAt: 0,
  view: null,
  startedAutomatically: new Set(),
  artwork: readArtworkState(),
  senseSelected: false,
  sendoffTimer: null,
  galleryYear: new Date().getFullYear(),
  galleryMonth: new Date().getMonth(),
};

const maxSlowDuration = 60;
const autoStartWindowMinutes = 1;

const views = {
  onboarding: document.querySelector("#onboardingView"),
  home: document.querySelector("#homeView"),
  slow: document.querySelector("#slowView"),
  transition: document.querySelector("#transitionView"),
  sendoff: document.querySelector("#sendoffView"),
  gallery: document.querySelector("#galleryView"),
};

const calendarDay = document.querySelector("#calendarDay");
const todayMeta = document.querySelector("#todayMeta");
const manualForm = document.querySelector("#manualForm");
const googleConnect = document.querySelector("#googleConnect");
const googleStatus = document.querySelector("#googleStatus");
const onboardingStatus = document.querySelector("#onboardingStatus");
const progressRing = document.querySelector("#progressRing");

function readRecentSlowIds() {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.recentSlows)) || [];
  } catch {
    return [];
  }
}

function todayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function withDemoHistory(history) {
  const merged = { ...history };
  for (const key of Object.keys(DEMO_HISTORY)) {
    if (!merged[key]) {
      merged[key] = DEMO_HISTORY[key];
    }
  }
  return merged;
}

// 今日のキャンバス(todayDrops)をlocalStorageに保存。日付が変わっていた場合は、前日ぶんをhistoryに確定保存してから、新しい空のキャンバスを始める
function readArtworkState() {
  const today = todayDateKey();
  const fallback = { date: today, todayDrops: [], history: withDemoHistory({}) };
  try {
    const raw = localStorage.getItem(storageKeys.artwork);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const history = withDemoHistory(
      typeof parsed.history === "object" && parsed.history !== null ? parsed.history : {}
    );
    if (parsed.date !== today) {
      if (parsed.date && Array.isArray(parsed.todayDrops) && parsed.todayDrops.length > 0) {
        history[parsed.date] = parsed.todayDrops;
      }
      return { date: today, todayDrops: [], history };
    }
    return { date: parsed.date, todayDrops: Array.isArray(parsed.todayDrops) ? parsed.todayDrops : [], history };
  } catch {
    return fallback;
  }
}

function writeArtworkState() {
  localStorage.setItem(storageKeys.artwork, JSON.stringify(state.artwork));
}

function randomJitter(range) {
  return (Math.random() - 0.5) * range;
}

// 選んだ色を1滴分のデータとして今日のキャンバスに追加する
function addArtworkDrop(colorKey) {
  const drop = {
    color: colorKey,
    x: 0.5 + randomJitter(0.5),
    y: 0.5 + randomJitter(0.5),
    size: 40 + Math.random() * 50,
  };
  state.artwork.todayDrops.push(drop);
  writeArtworkState();
  return drop;
}

function pseudoRandom(seed) {
  const value = Math.sin(seed) * 43758.5453;
  return value - Math.floor(value);
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

// 1滴の絵の具を、水面に垂らしたインクのように「にじんで歪んだ」見た目にするため、
// 中心をわずかにずらした複数の半透明円を重ねて描画する(React版ArtworkCanvasと同じロジック)。
function drawInkBlot(ctx, drop, canvasSize) {
  const hex = senseColorHex[drop.color] || "#999999";
  const rgb = hexToRgb(hex);
  const seed = drop.x * 97.13 + drop.y * 57.31 + drop.size * 13.7;
  const size = drop.size * (canvasSize / 360);
  const cx = drop.x * canvasSize;
  const cy = drop.y * canvasSize;

  for (let i = 3; i >= 0; i -= 1) {
    const s = seed + i * 19.7;
    const offsetX = (pseudoRandom(s + 1) - 0.5) * size * 0.3;
    const offsetY = (pseudoRandom(s + 2) - 0.5) * size * 0.3;
    const scale = 1 + i * (0.22 + pseudoRandom(s + 3) * 0.12);
    const layerSize = size * scale;
    const opacity = Math.max(0.32 - i * 0.06 + pseudoRandom(s + 5) * 0.05, 0.05);

    ctx.beginPath();
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    ctx.arc(cx + offsetX, cy + offsetY, layerSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderDropsOnCanvas(canvasEl, drops) {
  const size = canvasEl.clientWidth || canvasEl.width;
  if (!size) return;
  const dpr = window.devicePixelRatio || 1;
  canvasEl.width = size * dpr;
  canvasEl.height = size * dpr;
  const ctx = canvasEl.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  drops.forEach((drop) => drawInkBlot(ctx, drop, size));
}

function dateKeyFor(year, month, day) {
  return `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function dropsForDateKey(key) {
  if (key === state.artwork.date) {
    // 今日の本物の選択がまだなければ、デモ用の固定データ(あれば)を代わりに見せる
    return state.artwork.todayDrops.length > 0 ? state.artwork.todayDrops : state.artwork.history[key] || [];
  }
  return state.artwork.history[key] || [];
}

// 月間カレンダー風のギャラリー。各日のセルに、その日のキャンバスをそのまま小さく描画する
function renderGallery() {
  const galleryTitle = document.querySelector("#galleryTitle");
  const galleryGrid = document.querySelector("#galleryGrid");
  const { galleryYear, galleryMonth } = state;

  galleryTitle.textContent = `${galleryYear}年${galleryMonth + 1}月`;
  galleryGrid.innerHTML = "";

  const firstWeekday = new Date(galleryYear, galleryMonth, 1).getDay();
  const daysInMonth = new Date(galleryYear, galleryMonth + 1, 0).getDate();
  const todayKey = todayDateKey();

  for (let i = 0; i < firstWeekday; i += 1) {
    const filler = document.createElement("div");
    filler.className = "gallery-day empty";
    galleryGrid.append(filler);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = dateKeyFor(galleryYear, galleryMonth, day);
    const drops = dropsForDateKey(key);
    const cell = document.createElement("div");
    cell.className = `gallery-day${key === todayKey ? " is-today" : ""}`;

    const number = document.createElement("span");
    number.className = "gallery-day-number";
    number.textContent = day;
    cell.append(number);

    if (drops.length > 0) {
      cell.classList.add("has-drops");
      cell.dataset.dateKey = key;
      const canvas = document.createElement("canvas");
      cell.append(canvas);
      galleryGrid.append(cell);
      requestAnimationFrame(() => renderDropsOnCanvas(canvas, drops));
    } else {
      galleryGrid.append(cell);
    }
  }
}

function openGalleryDay(key) {
  const drops = dropsForDateKey(key);
  if (drops.length === 0) return;
  const [year, month, day] = key.split("-").map(Number);
  document.querySelector("#galleryDayLabel").textContent = `${year}年${month}月${day}日`;
  document.querySelector("#galleryDayOverlay").classList.remove("hidden");
  const canvas = document.querySelector("#galleryDayCanvas");
  requestAnimationFrame(() => renderDropsOnCanvas(canvas, drops));

  // AI対話は、その構図を見て書いた日付にしか用意していないため、それ以外の日はボタンをグレーアウトする
  const playButton = document.querySelector("#dialoguePlayButton");
  const script = DIALOGUES[key];
  dialogueState.script = script || null;
  playButton.disabled = !script;
  playButton.setAttribute(
    "aria-label",
    script ? "AI対話を再生" : "AI対話はこのキャンバス用にまだ用意されていません"
  );
}

function closeGalleryDay() {
  resetDialogue();
  document.querySelector("#galleryDayOverlay").classList.add("hidden");
}

// デモ用に用意した、AI同士が絵について語り合う対話(畑中アプリのSAMPLE_DIALOGUEを踏襲)。
// 実際のキャンバスの構図を見て書いているため、日付ごとに台本が異なる(DIALOGUES[日付])。
// 対応する日付以外では構図が一致しないため、その日を開いたときだけボタンを有効にする。
const DIALOGUES = {
  // 静かな緑5滴が、あたたかい金色4滴を包み込むように寄り添う構図
  "2026-07-25": [
    { speaker: "AI-A", text: "見て、あたたかい金色が真ん中に集まって、そっと寄り添っている" },
    { speaker: "AI-B", text: "その周りを、静かな緑が包み込むように囲んでいるね。守られているような、でも窮屈ではない距離感だ" },
    { speaker: "AI-A", text: "色同士が混じり合わずに、それぞれの形を保ったまま隣り合っているのも面白いね" },
    { speaker: "AI-C", text: "少し脱線してもいい?この配置を見ていると、焚き火を囲む人だかりを思い出すんだ。真ん中のあたたかい金色が炎で、緑がそれを囲む人たちみたいに見える" },
    { speaker: "AI-B", text: "いいたとえだね。今日は、遠くへ離れていった色がひとつもなかった" },
    { speaker: "AI-A", text: "そうだね。今日はただ、寄り添うことを選んだ一日だったのかもしれない" },
  ],
  // 澄んだ青2滴と静かな緑1滴が画面の左側に寄り、右半分がずっと余白のままの構図
  "2026-07-24": [
    { speaker: "AI-A", text: "今日は、色がずいぶん左側に寄っているね。右側はずっと静かなままだ" },
    { speaker: "AI-B", text: "澄んだ青が二つ、大きさを変えながら並んでいる。近くにいるけど、重なってはいない" },
    { speaker: "AI-A", text: "その端に、静かな緑がほんの少しだけ顔をのぞかせているね。切れてしまいそうなくらい、端にいる" },
    { speaker: "AI-C", text: "少し脱線してもいい?この配置を見ていると、窓の外を眺めている誰かの横顔を思い出すんだ。青が輪郭で、緑がその向こうに見える景色みたいに" },
    { speaker: "AI-B", text: "面白い見方だね。右側の余白は、まだ何も描かれていないだけかもしれない" },
    { speaker: "AI-A", text: "そうだね。今日は、少しの色と、たくさんの余白でできていたのかもしれない" },
  ],
};

const SPEAKER_PAUSE_MS = 350;
const dialogueState = { playing: false, timer: null, index: -1, script: null };

const PLAY_ICON_PATH = "M8 5v14l11-7z";
const PAUSE_ICON_PATH = "M7 5h4v14H7zM13 5h4v14h-4z";

function setDialogueButtonIcon(playing) {
  const button = document.querySelector("#dialoguePlayButton");
  const icon = document.querySelector("#dialoguePlayIcon");
  icon.setAttribute("d", playing ? PAUSE_ICON_PATH : PLAY_ICON_PATH);
  button.setAttribute("aria-label", playing ? "AI対話を一時停止" : "AI対話を再生");
  button.classList.toggle("is-playing", playing);
}

function speakDialogueLine(index) {
  const lineEl = document.querySelector("#dialogueLine");
  const script = dialogueState.script;
  if (!script || index >= script.length) {
    resetDialogue();
    return;
  }
  dialogueState.index = index;
  const line = script[index];
  const previousSpeaker = index > 0 ? script[index - 1].speaker : null;
  const speakerChanged = previousSpeaker !== null && previousSpeaker !== line.speaker;

  lineEl.textContent = `${line.speaker}: ${line.text}`;
  lineEl.classList.add("visible");

  if (!window.speechSynthesis) {
    dialogueState.timer = window.setTimeout(() => speakDialogueLine(index + 1), 2600);
    return;
  }

  const utterance = new SpeechSynthesisUtterance(line.text);
  utterance.lang = "ja-JP";
  utterance.onend = () => {
    if (!dialogueState.playing) return;
    lineEl.classList.remove("visible");
    dialogueState.timer = window.setTimeout(
      () => speakDialogueLine(index + 1),
      speakerChanged ? SPEAKER_PAUSE_MS : 150
    );
  };
  utterance.onerror = () => {
    if (!dialogueState.playing) return;
    speakDialogueLine(index + 1);
  };
  window.speechSynthesis.speak(utterance);
}

// 再生ボタンを押すと、一時停止していた行から続きを話す(常に最初からにはしない)
function playDialogue() {
  dialogueState.playing = true;
  setDialogueButtonIcon(true);
  speakDialogueLine(Math.max(dialogueState.index, 0));
}

// 一時停止:途中経過(dialogueState.index)は保持したまま、音声とタイマーだけ止める
function pauseDialogue() {
  dialogueState.playing = false;
  window.clearTimeout(dialogueState.timer);
  window.speechSynthesis?.cancel();
  setDialogueButtonIcon(false);
}

// 完全リセット:オーバーレイを閉じた時や対話が最後まで終わった時に、最初から再生できる状態に戻す
function resetDialogue() {
  pauseDialogue();
  dialogueState.index = -1;
  document.querySelector("#dialogueLine").classList.remove("visible");
}

function changeGalleryMonth(delta) {
  const next = new Date(state.galleryYear, state.galleryMonth + delta, 1);
  state.galleryYear = next.getFullYear();
  state.galleryMonth = next.getMonth();
  renderGallery();
}

function readStoredEvents() {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.events));
  } catch {
    return null;
  }
}

function writeStoredEvents() {
  localStorage.setItem(storageKeys.events, JSON.stringify(state.events));
}

function rememberSlow(id) {
  state.recentSlowIds = [id, ...state.recentSlowIds.filter((item) => item !== id)].slice(0, 6);
  localStorage.setItem(storageKeys.recentSlows, JSON.stringify(state.recentSlowIds));
}

function minutesFromTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function nowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function isCurrentEvent(event, minutes = nowMinutes()) {
  const start = minutesFromTime(event.start);
  const end = start + Number(event.duration);
  return start <= minutes && minutes < end;
}

function isUpcomingSoon(event, minutes = nowMinutes()) {
  const start = minutesFromTime(event.start);
  const diff = start - minutes;
  return diff >= 0 && diff <= (appConfig.upcomingWindowMinutes || 7);
}

function getActivePrompt() {
  if (state.events.some((event) => isCurrentEvent(event))) {
    return null;
  }

  const upcoming = state.events
    .filter((event) => !state.dismissed.has(event.id) && isUpcomingSoon(event))
    .sort((a, b) => minutesFromTime(a.start) - minutesFromTime(b.start))[0];

  if (!upcoming) {
    return null;
  }

  const index = state.events.findIndex((event) => event.id === upcoming.id);
  return buildProposalForEvent(upcoming, index);
}

function selectSlowForEvent(event, index) {
  const eventSeed = minutesFromTime(event.start) + event.title.length + index;
  const ordered = microSlows
    .map((slow, slowIndex) => ({
      slow,
      score: (slowIndex * 7 + eventSeed) % microSlows.length,
    }))
    .sort((a, b) => a.score - b.score)
    .map((item) => item.slow);

  return ordered.find((slow) => !state.recentSlowIds.includes(slow.id)) || ordered[0];
}

function hasPreEventSpace(event) {
  const startMinutes = minutesFromTime(event.start);
  const slowStart = startMinutes - 5;
  return !state.events
    .filter((candidate) => candidate.id !== event.id)
    .some((candidate) => {
      const end = minutesFromTime(candidate.start) + Number(candidate.duration);
      return end > slowStart - 3 && end <= startMinutes;
    });
}

function buildProposalForEvent(event, index) {
  const startMinutes = minutesFromTime(event.start);
  const slowStart = startMinutes - 5;
  return {
    id: event.id,
    event,
    slow: selectSlowForEvent(event, index),
    slowStart: timeFromMinutes(slowStart),
    slowStartMinutes: slowStart,
    eventStartMinutes: startMinutes,
    hasSpace: hasPreEventSpace(event),
  };
}

const VIEW_FADE_MS = 320;
const mainEl = document.querySelector("main");

// 番組の切り替えもフェードで行う(ページめくりのような明確な切り替えを避け、穏やかに切り替わる)
// fadeMsを指定すると、その画面だけフェードをゆっくりにできる(Slow画面への突入を穏やかにするため)
function showView(name, { fadeMs } = {}) {
  const duration = fadeMs || VIEW_FADE_MS;
  const current = state.view ? views[state.view] : null;
  const next = views[name];

  if (current && current !== next) {
    // 画面ごとに高さが違うと、切り替え時に背景の四角がカクッと伸縮して見えるため、
    // 遷移中はmainの高さを一旦固定し、次の画面の高さへ滑らかにアニメーションさせる
    mainEl.style.minHeight = `${mainEl.getBoundingClientRect().height}px`;

    current.style.transitionDuration = `${duration}ms`;
    current.classList.add("fade-out");
    window.setTimeout(() => {
      current.classList.add("hidden");
      current.classList.remove("fade-out");
      current.style.transitionDuration = "";
    }, duration);
  }

  Object.values(views).forEach((view) => {
    if (view !== current) {
      view.classList.add("hidden");
    }
  });

  next.style.transitionDuration = `${duration}ms`;
  next.classList.remove("hidden");
  next.classList.add("fade-out");
  void next.offsetWidth;
  requestAnimationFrame(() => {
    next.classList.remove("fade-out");
    if (current && current !== next) {
      const targetHeight = next.scrollHeight;
      requestAnimationFrame(() => {
        mainEl.style.minHeight = `${targetHeight}px`;
      });
      window.setTimeout(() => {
        mainEl.style.minHeight = "";
        next.style.transitionDuration = "";
      }, duration);
    } else {
      window.setTimeout(() => {
        next.style.transitionDuration = "";
      }, duration);
    }
  });
  state.view = name;
}

function activateSource(source) {
  state.source = source;
  localStorage.setItem(storageKeys.source, source);
  document.querySelectorAll(".toggle-button").forEach((item) => {
    item.classList.toggle("active", item.dataset.source === source);
  });
  manualForm.classList.toggle("hidden", source !== "manual");
  googleConnect.classList.toggle("hidden", source !== "google");
}

function replaceEventsFromGoogle(events) {
  const localEvents = state.events.filter((event) => event.source === "manual");
  state.events = [...events, ...localEvents].sort((a, b) => minutesFromTime(a.start) - minutesFromTime(b.start));
  writeStoredEvents();
  const eventIds = new Set(state.events.map((event) => event.id));
  state.dismissed = new Set([...state.dismissed].filter((id) => eventIds.has(id)));
  state.startedAutomatically = new Set([...state.startedAutomatically].filter((id) => eventIds.has(id)));
  activateSource("google");
  syncReminderBackends();
}

function completeOnboarding(source = "google") {
  state.onboarded = true;
  localStorage.setItem(storageKeys.onboarded, "true");
  activateSource(source);
  showView("home");
  renderHome();
}

function renderHome() {
  const proposals = state.events.map(buildProposalForEvent);
  const activePrompt = getActivePrompt();
  const availableCount = proposals.filter((proposal) => proposal.hasSpace && !state.dismissed.has(proposal.id)).length;
  todayMeta.textContent = activePrompt
    ? `${activePrompt.event.title} がもうすぐ始まります`
    : state.events.length === 0
      ? "今日の予定はまだありません"
      : availableCount > 0
        ? `${availableCount}件は、5分前にゆっくりフレッシュします`
        : "ゆっくりフレッシュする予定はありません";
  calendarDay.innerHTML = "";

  if (activePrompt) {
    const prompt = document.createElement("article");
    prompt.className = "active-prompt";
    prompt.innerHTML = `
      <div>
        <p class="eyebrow">ゆっくりフレッシュ 提案</p>
        <h3>${activePrompt.event.start} ${activePrompt.event.title}</h3>
        <p>${Math.min(activePrompt.slow.seconds, maxSlowDuration)}秒だけ整える。</p>
      </div>
      <button class="primary-button" data-action="start" data-id="${activePrompt.id}" type="button">はじめる</button>
    `;
    calendarDay.append(prompt);
  }

  if (state.events.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = "<p>今日の予定はまだありません</p>";
    calendarDay.append(empty);
    return;
  }

  proposals.forEach((proposal) => {
    const eventEnd = timeFromMinutes(minutesFromTime(proposal.event.start) + Number(proposal.event.duration));
    const isDismissed = state.dismissed.has(proposal.id);
    const autoLabel = proposal.hasSpace ? (isDismissed ? "見送る" : "届く") : "余白少";
    const item = document.createElement("article");
    item.className = `calendar-event${isDismissed ? " dismissed" : ""}`;
    item.innerHTML = `
      <div class="event-time">
        <span>${proposal.event.start}</span>
        <span>${eventEnd}</span>
      </div>
      <button class="event-card" data-action="start" data-id="${proposal.id}" type="button">
        <span class="event-title">${proposal.event.title}</span>
        <span class="event-subtext">ゆっくりフレッシュ ${proposal.slowStart}〜（${Math.min(proposal.slow.seconds, maxSlowDuration)}秒）</span>
      </button>
      <button class="event-badge${proposal.hasSpace ? "" : " disabled"}" data-action="toggle-auto" data-id="${proposal.id}" type="button" ${
      proposal.hasSpace ? "" : "disabled"
    }>${autoLabel}</button>
      <button class="dismiss-event" data-action="delete" data-id="${proposal.event.id}" type="button" aria-label="${proposal.event.title}を削除">×</button>
    `;
    calendarDay.append(item);
  });
}

function startSlow(proposalId, options = {}) {
  const proposal = state.events.map(buildProposalForEvent).find((item) => item.id === proposalId);
  if (!proposal) return;
  if (options.fromExternalTrigger) {
    state.startedAutomatically.add(proposal.id);
  }

  state.currentProposal = proposal;
  state.currentSlow = {
    ...proposal.slow,
    seconds: Math.min(proposal.slow.seconds, maxSlowDuration),
  };
  document.querySelector("#slowTitle").textContent = state.currentSlow.title;
  document.querySelector("#slowInstruction").textContent = state.currentSlow.instruction;
  document.querySelector("#slowDuration").textContent = `${state.currentSlow.seconds}秒`;

  // 呼吸円だけを先に見せ、テキストは少し遅れてふわっと出す(自動起動時も含め、突然全部が現れる驚きを和らげる)
  const slowText = document.querySelector("#slowText");
  slowText.classList.remove("visible");
  showView("slow", { fadeMs: 700 });
  window.setTimeout(() => {
    slowText.classList.add("visible");
  }, 500);

  desktop?.enterSlowMode?.();
  rememberSlow(state.currentSlow.id);
  runProgress();
}

function startSlowFromExternalTrigger(proposalId) {
  if (state.view === "slow" || state.view === "transition") {
    return;
  }

  if (state.dismissed.has(proposalId) || state.startedAutomatically.has(proposalId)) {
    return;
  }

  startSlow(proposalId, { fromExternalTrigger: true });
}

function buildDesktopReminders() {
  const now = Date.now();
  return state.events
    .map(buildProposalForEvent)
    .filter((proposal) => proposal.hasSpace && !state.dismissed.has(proposal.id))
    .map((proposal) => {
      const dueAt = new Date();
      dueAt.setHours(Math.floor(proposal.slowStartMinutes / 60), proposal.slowStartMinutes % 60, 0, 0);
      return {
        id: proposal.id,
        eventTitle: proposal.event.title,
        seconds: Math.min(proposal.slow.seconds, maxSlowDuration),
        dueAt: dueAt.toISOString(),
      };
    })
    .filter((reminder) => new Date(reminder.dueAt).getTime() > now);
}

function syncDesktopReminders() {
  if (!desktop?.setReminders) {
    return;
  }

  desktop.setReminders(buildDesktopReminders()).catch((error) => {
    console.error("Desktop reminder sync failed.", error);
  });
}

function syncReminderBackends() {
  syncDesktopReminders();
}

function getDueStartProposal(minutes = nowMinutes()) {
  if (!state.onboarded || state.view === "onboarding" || state.view === "slow" || state.view === "transition") {
    return null;
  }

  if (state.events.some((event) => isCurrentEvent(event, minutes))) {
    return null;
  }

  return state.events
    .map(buildProposalForEvent)
    .filter((proposal) => {
      return (
        proposal.hasSpace &&
        !state.dismissed.has(proposal.id) &&
        !state.startedAutomatically.has(proposal.id) &&
        proposal.slowStartMinutes <= minutes &&
        minutes < proposal.slowStartMinutes + autoStartWindowMinutes
      );
    })
    .sort((a, b) => a.eventStartMinutes - b.eventStartMinutes)[0] || null;
}

function startDueSlow() {
  const proposal = getDueStartProposal();
  if (!proposal) {
    if (state.view === "home") {
      renderHome();
    }
    return;
  }

  state.startedAutomatically.add(proposal.id);
  startSlow(proposal.id);
}

function bootDesktopRuntime() {
  renderHome();
}

function startAutoStartScheduler() {
  window.clearInterval(state.schedulerTimer);
  state.schedulerTimer = window.setInterval(startDueSlow, 15000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      startDueSlow();
    }
  });
  startDueSlow();
}

function startGoogleAutoSync() {
  window.clearTimeout(state.googleSyncTimer);
  if (!desktop?.isElectron) {
    return;
  }

  const syncIfAvailable = () => {
    if (!state.onboarded || state.source !== "google" || state.view === "slow" || state.view === "transition") {
      return;
    }
    loadGoogleEvents();
  };
  const scheduleNextHourlySync = () => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    state.googleSyncTimer = window.setTimeout(() => {
      syncIfAvailable();
      scheduleNextHourlySync();
    }, nextHour.getTime() - now.getTime());
  };

  syncIfAvailable();
  scheduleNextHourlySync();
}

function reloadCurrentSource() {
  if (state.source === "google") {
    loadGoogleEvents();
    return;
  }
  renderHome();
}

function runProgress() {
  window.clearInterval(state.timer);
  state.startedAt = Date.now();
  progressRing.style.background = "conic-gradient(var(--accent) 0deg, rgba(46, 111, 101, 0.1) 0deg)";
  state.timer = window.setInterval(() => {
    const elapsed = (Date.now() - state.startedAt) / 1000;
    const ratio = Math.min(elapsed / state.currentSlow.seconds, 1);
    const degrees = Math.round(ratio * 360);
    progressRing.style.background = `conic-gradient(var(--accent) ${degrees}deg, rgba(46, 111, 101, 0.1) ${degrees}deg)`;
    if (ratio >= 1) {
      finishSlow();
    }
  }, 250);
}

function finishSlow() {
  window.clearInterval(state.timer);
  window.clearTimeout(state.transitionTimer);
  const event = state.currentProposal?.event;
  if (event) {
    state.dismissed.add(event.id);
  }
  state.senseSelected = false;
  views.transition.classList.remove("is-selecting");
  document.querySelectorAll(".sense-button").forEach((item) => item.classList.remove("selected"));
  document.querySelectorAll(".sense-ripple").forEach((ripple) => ripple.remove());
  showView("transition");
  state.transitionTimer = window.setTimeout(completeTransition, 60000);
}

// 畑中アプリのSendOffScreenを踏襲:「いってらっしゃい」のみを見せ、1.8秒後に自動で戻る
function showSendoff() {
  window.clearTimeout(state.transitionTimer);
  showView("sendoff");
  state.sendoffTimer = window.setTimeout(completeTransition, 1800);
}

function completeTransition() {
  window.clearTimeout(state.transitionTimer);
  window.clearTimeout(state.sendoffTimer);
  showView("home");
  renderHome();
  desktop?.leaveSlowMode?.();
}

function handleProposalAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  if (button.dataset.action === "start") {
    startSlow(id);
  }
  if (button.dataset.action === "toggle-auto") {
    const proposal = state.events.map(buildProposalForEvent).find((item) => item.id === id);
    if (!proposal?.hasSpace) return;
    if (state.dismissed.has(id)) {
      state.dismissed.delete(id);
      state.startedAutomatically.delete(id);
    } else {
      state.dismissed.add(id);
    }
    syncReminderBackends();
    renderHome();
  }
  if (button.dataset.action === "delete") {
    state.events = state.events.filter((item) => item.id !== id);
    state.dismissed.delete(id);
    state.startedAutomatically.delete(id);
    writeStoredEvents();
    syncReminderBackends();
    renderHome();
  }
}

function addManualEvent(event) {
  event.preventDefault();
  const title = document.querySelector("#eventTitleInput").value.trim() || "予定";
  const start = document.querySelector("#eventTimeInput").value;
  const duration = Number(document.querySelector("#eventDurationInput").value);
  state.events.push({
    id: `manual-${Date.now()}`,
    title,
    start,
    duration,
    source: "manual",
  });
  state.events.sort((a, b) => minutesFromTime(a.start) - minutesFromTime(b.start));
  writeStoredEvents();
  syncReminderBackends();
  renderHome();
}

function getGoogleLoadErrorMessage(error) {
  const message = error?.message || "";
  if (message.includes("client_secret is missing")) {
    return "このGoogle OAuth ClientではClient Secretが必要です。config.local.jsにgoogleClientSecretを設定してから起動してください。";
  }
  return message;
}

async function loadGoogleEvents() {
  googleStatus.textContent = "Google Calendarを読み込んでいます。";
  onboardingStatus.classList.add("hidden");
  try {
    if (!desktop?.loadGoogleEvents) {
      throw new Error("Electron Google Calendar bridge is not available.");
    }

    const events = await desktop.loadGoogleEvents({
      googleClientId: appConfig.googleClientId,
      googleClientSecret: appConfig.googleClientSecret,
      googleCalendarId: appConfig.googleCalendarId,
      googleCalendarIds: appConfig.googleCalendarIds,
    });
    replaceEventsFromGoogle(events);
    googleStatus.textContent = `${events.length}件の予定を読み込みました。`;
    if (!state.onboarded) {
      completeOnboarding("google");
    }
    renderHome();
  } catch (error) {
    const message = getGoogleLoadErrorMessage(error);
    const detail = message ? ` ${message}` : "";
    googleStatus.textContent = `Google Calendarを読み込めませんでした。${detail}`;
    onboardingStatus.textContent = `Google Calendarを読み込めませんでした。${detail}`;
    onboardingStatus.classList.remove("hidden");
    console.error(error);
  }
}

document.querySelector("#calendarDay").addEventListener("click", handleProposalAction);
document.querySelector("#finishSlowButton").addEventListener("click", finishSlow);
document.querySelector("#reloadButton").addEventListener("click", reloadCurrentSource);
document.querySelector("#googleConnectButton").addEventListener("click", loadGoogleEvents);
document.querySelector("#onboardingGoogleButton").addEventListener("click", loadGoogleEvents);
document.querySelector("#onboardingManualButton").addEventListener("click", () => {
  completeOnboarding("manual");
});
document.querySelector("#galleryButton").addEventListener("click", () => {
  state.galleryYear = new Date().getFullYear();
  state.galleryMonth = new Date().getMonth();
  showView("gallery");
  renderGallery();
});
document.querySelector("#galleryPrevButton").addEventListener("click", () => changeGalleryMonth(-1));
document.querySelector("#galleryNextButton").addEventListener("click", () => changeGalleryMonth(1));
document.querySelector("#galleryBackButton").addEventListener("click", () => {
  showView("home");
  renderHome();
});
document.querySelector("#galleryGrid").addEventListener("click", (event) => {
  const cell = event.target.closest(".gallery-day.has-drops");
  if (!cell) return;
  openGalleryDay(cell.dataset.dateKey);
});
document.querySelector("#galleryDayCloseButton").addEventListener("click", closeGalleryDay);
document.querySelector("#dialoguePlayButton").addEventListener("click", () => {
  if (dialogueState.playing) {
    pauseDialogue();
  } else {
    playDialogue();
  }
});
document.querySelector("#galleryDayOverlay").addEventListener("click", (event) => {
  if (event.target.id === "galleryDayOverlay") {
    closeGalleryDay();
  }
});
document.querySelectorAll(".toggle-button").forEach((button) => {
  button.addEventListener("click", () => {
    activateSource(button.dataset.source);
  });
});

document.querySelectorAll(".sense-button").forEach((button) => {
  button.addEventListener("click", () => {
    if (state.senseSelected) return;
    state.senseSelected = true;
    const colorKey = button.dataset.sense;
    addArtworkDrop(colorKey);

    // 畑中アプリのColorExitScreenを踏襲:選んだ色はボタンの位置ではなく画面中央から円状に広がって消える。
    // 選択と同時にパレットを隠し、波紋だけの画面にする
    views.transition.classList.add("is-selecting");

    const senseRow = document.querySelector(".sense-row");
    const ripple = document.createElement("span");
    ripple.className = "sense-ripple";
    ripple.style.background = senseColorHex[colorKey] || "#999999";
    const duration = 900 + Math.random() * 500;
    ripple.style.transitionDuration = `${duration}ms`;
    senseRow.append(ripple);
    void ripple.offsetWidth;
    requestAnimationFrame(() => ripple.classList.add("spread"));

    window.setTimeout(() => {
      showSendoff();
    }, duration);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeGalleryDay();
    return;
  }
  if (event.key !== "Enter") {
    return;
  }
  event.preventDefault();
  if (state.view === "slow") {
    finishSlow();
  } else if (state.view === "transition") {
    showSendoff();
  } else if (state.view === "sendoff") {
    completeTransition();
  }
});

manualForm.addEventListener("submit", addManualEvent);
if (state.onboarded) {
  activateSource(state.source);
  showView("home");
  renderHome();
} else {
  showView("onboarding");
}
bootDesktopRuntime();
startAutoStartScheduler();
startGoogleAutoSync();
if (desktop?.isElectron) {
  desktop.onStartSlow(startSlowFromExternalTrigger);
}
syncReminderBackends();
