const microSlows = window.MICRO_SLOWS;

const sampleEvents = [
  { id: "e1", title: "進捗確認", start: "10:30", duration: 30, source: "sample" },
  { id: "e2", title: "企画会議", start: "13:00", duration: 60, source: "sample" },
  { id: "e3", title: "レビュー", start: "15:30", duration: 30, source: "sample" },
  { id: "e4", title: "共有会", start: "17:00", duration: 45, source: "sample" },
];

const state = {
  source: "sample",
  events: readStoredEvents() || [...sampleEvents],
  dismissed: new Set(),
  recentSlowIds: readRecentSlowIds(),
  onboarded: localStorage.getItem("slow-index-onboarded") === "true",
  currentProposal: null,
  currentSlow: null,
  timer: null,
  schedulerTimer: null,
  serviceWorkerRegistration: null,
  startedAt: 0,
  view: null,
  startedAutomatically: new Set(),
  settings: {
    maxSuggestions: 3,
    maxDuration: 60,
  },
};

const views = {
  onboarding: document.querySelector("#onboardingView"),
  home: document.querySelector("#homeView"),
  slow: document.querySelector("#slowView"),
  transition: document.querySelector("#transitionView"),
  settings: document.querySelector("#settingsView"),
};

const calendarDay = document.querySelector("#calendarDay");
const todayMeta = document.querySelector("#todayMeta");
const manualForm = document.querySelector("#manualForm");
const googleConnect = document.querySelector("#googleConnect");
const googleStatus = document.querySelector("#googleStatus");
const onboardingStatus = document.querySelector("#onboardingStatus");
const progressRing = document.querySelector("#progressRing");
const notificationButton = document.querySelector("#notificationButton");
const testNotificationButton = document.querySelector("#testNotificationButton");
const notificationStatus = document.querySelector("#notificationStatus");

function readRecentSlowIds() {
  try {
    return JSON.parse(localStorage.getItem("slow-index-recent-slows")) || [];
  } catch {
    return [];
  }
}

function readStoredEvents() {
  try {
    return JSON.parse(localStorage.getItem("slow-index-events"));
  } catch {
    return null;
  }
}

function writeStoredEvents() {
  localStorage.setItem("slow-index-events", JSON.stringify(state.events));
}

function rememberSlow(id) {
  state.recentSlowIds = [id, ...state.recentSlowIds.filter((item) => item !== id)].slice(0, 6);
  localStorage.setItem("slow-index-recent-slows", JSON.stringify(state.recentSlowIds));
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
  return diff >= 0 && diff <= (window.SLOW_INDEX_CONFIG?.upcomingWindowMinutes || 7);
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

function showView(name) {
  Object.values(views).forEach((view) => view.classList.add("hidden"));
  views[name].classList.remove("hidden");
  state.view = name;
}

function activateSource(source) {
  state.source = source;
  document.querySelectorAll(".toggle-button").forEach((item) => {
    item.classList.toggle("active", item.dataset.source === source);
  });
  manualForm.classList.toggle("hidden", source !== "manual");
  googleConnect.classList.toggle("hidden", source !== "google");
}

function completeOnboarding(source = "sample") {
  state.onboarded = true;
  localStorage.setItem("slow-index-onboarded", "true");
  activateSource(source);
  showView("home");
  renderHome();
}

function renderHome() {
  const proposals = state.events.map(buildProposalForEvent);
  const activePrompt = getActivePrompt();
  const availableCount = proposals.filter((proposal) => proposal.hasSpace && !state.dismissed.has(proposal.id)).length;
  todayMeta.textContent = activePrompt
    ? `${activePrompt.event.title} がもうすぐ始まります。`
    : `${state.events.length}件の予定。${availableCount}件は直前にMicro Slowを置けます。`;
  calendarDay.innerHTML = "";

  if (activePrompt) {
    const prompt = document.createElement("article");
    prompt.className = "active-prompt";
    prompt.innerHTML = `
      <div>
        <p class="eyebrow">Micro Slow 提案</p>
        <h3>${activePrompt.event.start} ${activePrompt.event.title}</h3>
        <p>${Math.min(activePrompt.slow.seconds, state.settings.maxDuration)}秒だけ整える。</p>
      </div>
      <button class="primary-button" data-action="start" data-id="${activePrompt.id}" type="button">はじめる</button>
    `;
    calendarDay.append(prompt);
  }

  if (state.events.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = "<p>今日の予定はまだありません。</p>";
    calendarDay.append(empty);
    return;
  }

  proposals.forEach((proposal) => {
    const eventEnd = timeFromMinutes(minutesFromTime(proposal.event.start) + Number(proposal.event.duration));
    const isDismissed = state.dismissed.has(proposal.id);
    const item = document.createElement("article");
    item.className = `calendar-event${isDismissed ? " dismissed" : ""}`;
    item.innerHTML = `
      <div class="event-time">
        <span>${proposal.event.start}</span>
        <span>${eventEnd}</span>
      </div>
      <button class="event-card" data-action="start" data-id="${proposal.id}" type="button" ${isDismissed ? "disabled" : ""}>
        <span class="event-title">${proposal.event.title}</span>
        <span class="event-subtext">${proposal.slowStart} から ${Math.min(proposal.slow.seconds, state.settings.maxDuration)}秒</span>
      </button>
      <div class="event-side">
        <span class="event-badge">${proposal.hasSpace ? "自動開始" : "余白少"}</span>
        <button class="dismiss-event" data-action="dismiss" data-id="${proposal.id}" type="button" aria-label="${proposal.event.title}のMicro Slowを今回はしない">×</button>
      </div>
    `;
    calendarDay.append(item);
  });
}

function startSlow(proposalId, options = {}) {
  const proposal = state.events.map(buildProposalForEvent).find((item) => item.id === proposalId);
  if (!proposal) return;
  if (options.fromNotification) {
    state.startedAutomatically.add(proposal.id);
  }

  state.currentProposal = proposal;
  state.currentSlow = {
    ...proposal.slow,
    seconds: Math.min(proposal.slow.seconds, state.settings.maxDuration),
  };
  document.querySelector("#slowTitle").textContent = state.currentSlow.title;
  document.querySelector("#slowInstruction").textContent = state.currentSlow.instruction;
  document.querySelector("#slowDuration").textContent = `最大 ${state.currentSlow.seconds}秒`;
  showView("slow");
  rememberSlow(state.currentSlow.id);
  runProgress();
}

function startSlowFromNotification(proposalId) {
  if (state.view === "slow" || state.view === "transition") {
    return;
  }

  if (state.dismissed.has(proposalId) || state.startedAutomatically.has(proposalId)) {
    return;
  }

  startSlow(proposalId, { fromNotification: true });
}

function isNotificationSupported() {
  return "Notification" in window;
}

function updateNotificationStatus() {
  if (window.SlowIndexElectron?.isElectron) {
    notificationButton.disabled = true;
    testNotificationButton.disabled = true;
    notificationStatus.textContent = "Electron版では通知ではなく、時刻になるとウィンドウを前面に表示します。";
    return;
  }

  const serviceWorkerReady = "serviceWorker" in navigator;
  const secureReady = window.isSecureContext;

  if (!isNotificationSupported()) {
    notificationButton.disabled = true;
    testNotificationButton.disabled = true;
    notificationStatus.textContent = "このブラウザは通知に対応していません。";
    return;
  }

  if (!secureReady || !serviceWorkerReady) {
    notificationButton.disabled = true;
    testNotificationButton.disabled = true;
    notificationStatus.textContent =
      "通知にはlocalhostまたはHTTPSでの起動が必要です。http://127.0.0.1:8000/ か http://localhost:8000/ で開いてください。";
    return;
  }

  notificationButton.disabled = false;
  testNotificationButton.disabled = Notification.permission !== "granted";

  if (Notification.permission === "granted") {
    notificationButton.textContent = "通知は許可済み";
    notificationStatus.textContent = "予定5分前に通知します。通知をクリックするとSlow Indexを開いてMicro Slowを開始します。";
    return;
  }

  if (Notification.permission === "denied") {
    notificationButton.textContent = "通知はブロック中";
    notificationStatus.textContent = "ブラウザまたはOSの設定からSlow Indexの通知を許可してください。";
    return;
  }

  notificationButton.textContent = "通知を許可";
  notificationStatus.textContent = "通知を許可すると、予定5分前にMicro Slowを知らせます。";
}

async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    updateNotificationStatus();
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    await subscribeToWebPush();
    syncReminderBackends();
  }
  updateNotificationStatus();
}

function getFirstAvailableProposal() {
  return state.events
    .map(buildProposalForEvent)
    .find((proposal) => proposal.hasSpace && !state.dismissed.has(proposal.id));
}

async function sendTestNotification() {
  if (!isNotificationSupported()) {
    updateNotificationStatus();
    return;
  }

  if (Notification.permission !== "granted") {
    await requestNotificationPermission();
  }

  const proposal = getFirstAvailableProposal();
  if (!proposal) {
    notificationStatus.textContent = "通知テストに使える予定がありません。手入力で予定を追加してください。";
    return;
  }

  const shown = await showSlowNotification(proposal, {
    title: "Slow Indexのテスト通知",
    body: "通知をクリックするとMicro Slowを開始します。",
    tag: "slow-index-test",
  });

  notificationStatus.textContent = shown
    ? "テスト通知を送信しました。OSの通知欄を確認してください。"
    : "通知を送信できませんでした。ブラウザの通知設定とService Workerの状態を確認してください。";
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    state.serviceWorkerRegistration = await navigator.serviceWorker.register("sw.js");
    updateNotificationStatus();
    return state.serviceWorkerRegistration;
  } catch (error) {
    console.error("Service Worker registration failed.", error);
    notificationStatus.textContent = "Service Workerを登録できませんでした。起動URLとブラウザ設定を確認してください。";
    return null;
  }
}

async function getServiceWorkerRegistration() {
  if (state.serviceWorkerRegistration) {
    return state.serviceWorkerRegistration;
  }

  if (!("serviceWorker" in navigator)) {
    return null;
  }

  state.serviceWorkerRegistration = await navigator.serviceWorker.ready;
  return state.serviceWorkerRegistration;
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

async function subscribeToWebPush() {
  const publicKey = window.SLOW_INDEX_CONFIG?.pushPublicKey;
  if (!publicKey || !("PushManager" in window)) {
    return false;
  }

  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    return false;
  }

  const subscription =
    (await registration.pushManager.getSubscription()) ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  return true;
}

function buildPushReminders() {
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
        seconds: Math.min(proposal.slow.seconds, state.settings.maxDuration),
        dueAt: dueAt.toISOString(),
        url: location.href,
      };
    })
    .filter((reminder) => new Date(reminder.dueAt).getTime() > now);
}

function syncDesktopReminders() {
  if (!window.SlowIndexElectron?.isElectron) {
    return;
  }

  window.SlowIndexElectron.setReminders(buildPushReminders()).catch((error) => {
    console.error("Desktop reminder sync failed.", error);
  });
}

async function syncPushReminders() {
  if (window.SlowIndexElectron?.isElectron) {
    return;
  }

  if (!isNotificationSupported() || Notification.permission !== "granted" || !window.SLOW_INDEX_CONFIG?.pushPublicKey) {
    return;
  }

  try {
    await subscribeToWebPush();
    await fetch("/api/push/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminders: buildPushReminders() }),
    });
  } catch (error) {
    console.error("Push reminder sync failed.", error);
  }
}

function syncReminderBackends() {
  syncDesktopReminders();
  syncPushReminders();
}

function handleServiceWorkerMessage(event) {
  if (event.data?.type !== "START_SLOW") {
    return;
  }

  startSlowFromNotification(event.data.proposalId);
}

async function showSlowNotification(proposal, overrides = {}) {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    return false;
  }

  const seconds = Math.min(proposal.slow.seconds, state.settings.maxDuration);
  await registration.showNotification(overrides.title || "Micro Slowの時間です", {
    body: overrides.body || `${proposal.event.title}の前に、${seconds}秒だけ整えます。`,
    tag: overrides.tag || `slow-index-${proposal.id}`,
    renotify: false,
    data: {
      proposalId: proposal.id,
      url: location.href,
    },
  });

  return true;
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
        minutes < proposal.eventStartMinutes
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

function handleStartupRequest() {
  const params = new URLSearchParams(window.location.search);
  const proposalId = params.get("startSlow");
  if (!proposalId) {
    return;
  }

  window.history.replaceState({}, "", window.location.pathname);
  window.setTimeout(() => {
    startSlowFromNotification(proposalId);
  }, 100);
}

function bootNotifications() {
  if (window.SlowIndexElectron?.isElectron) {
    handleStartupRequest();
    renderHome();
    return;
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
  }

  registerServiceWorker().then(() => {
    updateNotificationStatus();
    handleStartupRequest();
    renderHome();
  });
}

function startNotificationScheduler() {
  window.clearInterval(state.schedulerTimer);
  state.schedulerTimer = window.setInterval(startDueSlow, 15000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      startDueSlow();
    }
  });
  startDueSlow();
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
  const event = state.currentProposal?.event;
  if (event) {
    state.dismissed.add(event.id);
    const start = minutesFromTime(event.start);
    const remaining = Math.max(start - minutesFromTime(state.currentProposal.slowStart), 0);
    document.querySelector("#transitionText").textContent = `${event.title}まで、まだ約${remaining}分あります。`;
  }
  showView("transition");
}

function handleProposalAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  if (button.dataset.action === "start") {
    if (state.dismissed.has(id)) return;
    startSlow(id);
  }
  if (button.dataset.action === "dismiss") {
    state.dismissed.add(id);
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

async function loadGoogleEvents() {
  if (window.SlowIndexElectron?.isElectron) {
    googleStatus.textContent = "Google Calendarを読み込んでいます。";
    onboardingStatus.classList.add("hidden");
    try {
      const events = await window.SlowIndexElectron.loadGoogleEvents({
        googleClientId: window.SLOW_INDEX_CONFIG?.googleClientId,
        googleCalendarId: window.SLOW_INDEX_CONFIG?.googleCalendarId || "primary",
      });
      state.events = events;
      writeStoredEvents();
      state.dismissed.clear();
      state.startedAutomatically.clear();
      googleStatus.textContent = `${events.length}件の予定を読み込みました。`;
      completeOnboarding("google");
      syncReminderBackends();
      renderHome();
    } catch (error) {
      const detail = error?.message ? ` ${error.message}` : "";
      googleStatus.textContent = `Google Calendarを読み込めませんでした。${detail}`;
      onboardingStatus.textContent = `Google Calendarを読み込めませんでした。${detail}`;
      onboardingStatus.classList.remove("hidden");
      console.error(error);
    }
    return;
  }

  if (!window.SlowIndexGoogleCalendar?.isConfigured()) {
    googleStatus.textContent = "config.js に Google OAuth Client ID を設定してください。";
    onboardingStatus.classList.remove("hidden");
    return;
  }

  googleStatus.textContent = "Google Calendarを読み込んでいます。";
  onboardingStatus.classList.add("hidden");
  try {
    const events = await window.SlowIndexGoogleCalendar.listTodayEvents();
    state.events = events;
    writeStoredEvents();
    state.dismissed.clear();
    state.startedAutomatically.clear();
    googleStatus.textContent = `${events.length}件の予定を読み込みました。`;
    completeOnboarding("google");
    syncReminderBackends();
    renderHome();
  } catch (error) {
    googleStatus.textContent = "Google Calendarを読み込めませんでした。設定と許可を確認してください。";
    onboardingStatus.textContent = "Google Calendarを読み込めませんでした。設定と許可を確認してください。";
    onboardingStatus.classList.remove("hidden");
    console.error(error);
  }
}

document.querySelector("#calendarDay").addEventListener("click", handleProposalAction);
document.querySelector("#finishSlowButton").addEventListener("click", finishSlow);
document.querySelector("#completeButton").addEventListener("click", () => {
  showView("home");
  renderHome();
});
document.querySelector("#reloadButton").addEventListener("click", renderHome);
document.querySelector("#googleConnectButton").addEventListener("click", loadGoogleEvents);
document.querySelector("#onboardingGoogleButton").addEventListener("click", loadGoogleEvents);
document.querySelector("#onboardingDemoButton").addEventListener("click", () => completeOnboarding("sample"));
document.querySelector("#settingsButton").addEventListener("click", () => showView("settings"));
notificationButton.addEventListener("click", requestNotificationPermission);
testNotificationButton.addEventListener("click", sendTestNotification);
document.querySelector("#saveSettingsButton").addEventListener("click", () => {
  state.settings.maxSuggestions = Number(document.querySelector("#maxSuggestionsInput").value);
  state.settings.maxDuration = Number(document.querySelector("#maxDurationInput").value);
  showView("home");
  renderHome();
});

document.querySelectorAll(".toggle-button").forEach((button) => {
  button.addEventListener("click", () => {
    activateSource(button.dataset.source);
    if (state.source === "sample") {
      state.events = [...sampleEvents];
      writeStoredEvents();
      state.dismissed.clear();
      state.startedAutomatically.clear();
      syncReminderBackends();
      renderHome();
    }
  });
});

document.querySelectorAll(".sense-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".sense-button").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    window.setTimeout(() => {
      showView("home");
      renderHome();
    }, 450);
  });
});

manualForm.addEventListener("submit", addManualEvent);
if (state.onboarded) {
  showView("home");
  renderHome();
} else {
  showView("onboarding");
}
updateNotificationStatus();
bootNotifications();
startNotificationScheduler();
if (window.SlowIndexElectron?.isElectron) {
  window.SlowIndexElectron.onStartSlow(startSlowFromNotification);
}
syncReminderBackends();
