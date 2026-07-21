const microSlows = window.MICRO_SLOWS;

const sampleEvents = [
  { id: "e1", title: "進捗確認", start: "10:30", duration: 30, source: "sample" },
  { id: "e2", title: "企画会議", start: "13:00", duration: 60, source: "sample" },
  { id: "e3", title: "レビュー", start: "15:30", duration: 30, source: "sample" },
  { id: "e4", title: "共有会", start: "17:00", duration: 45, source: "sample" },
];

const state = {
  source: localStorage.getItem("slow-index-source") || "sample",
  events: readStoredEvents() || [...sampleEvents],
  dismissed: new Set(),
  recentSlowIds: readRecentSlowIds(),
  onboarded: localStorage.getItem("slow-index-onboarded") === "true",
  currentProposal: null,
  currentSlow: null,
  timer: null,
  schedulerTimer: null,
  googleSyncTimer: null,
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
  localStorage.setItem("slow-index-source", source);
  document.querySelectorAll(".toggle-button").forEach((item) => {
    item.classList.toggle("active", item.dataset.source === source);
  });
  manualForm.classList.toggle("hidden", source !== "manual");
  googleConnect.classList.toggle("hidden", source !== "google");
}

function replaceEventsFromGoogle(events) {
  state.events = events;
  writeStoredEvents();
  state.dismissed.clear();
  state.startedAutomatically.clear();
  activateSource("google");
  syncReminderBackends();
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
  if (options.fromExternalTrigger) {
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
        seconds: Math.min(proposal.slow.seconds, state.settings.maxDuration),
        dueAt: dueAt.toISOString(),
      };
    })
    .filter((reminder) => new Date(reminder.dueAt).getTime() > now);
}

function syncDesktopReminders() {
  if (!window.SlowIndexElectron?.setReminders) {
    return;
  }

  window.SlowIndexElectron.setReminders(buildDesktopReminders()).catch((error) => {
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
  window.clearInterval(state.googleSyncTimer);
  if (!window.SlowIndexElectron?.isElectron) {
    return;
  }

  state.googleSyncTimer = window.setInterval(() => {
    if (state.source !== "google" || state.view === "slow" || state.view === "transition") {
      return;
    }
    loadGoogleEvents();
  }, 60 * 60 * 1000);
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
  googleStatus.textContent = "Google Calendarを読み込んでいます。";
  onboardingStatus.classList.add("hidden");
  try {
    if (!window.SlowIndexElectron?.loadGoogleEvents) {
      throw new Error("Electron Google Calendar bridge is not available.");
    }

    const events = await window.SlowIndexElectron.loadGoogleEvents({
      googleClientId: window.SLOW_INDEX_CONFIG?.googleClientId,
      googleClientSecret: window.SLOW_INDEX_CONFIG?.googleClientSecret,
      googleCalendarId: window.SLOW_INDEX_CONFIG?.googleCalendarId || "primary",
    });
    replaceEventsFromGoogle(events);
    googleStatus.textContent = `${events.length}件の予定を読み込みました。`;
    if (!state.onboarded) {
      completeOnboarding("google");
    }
    renderHome();
  } catch (error) {
    const detail = error?.message ? ` ${error.message}` : "";
    googleStatus.textContent = `Google Calendarを読み込めませんでした。${detail}`;
    onboardingStatus.textContent = `Google Calendarを読み込めませんでした。${detail}`;
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
document.querySelector("#reloadButton").addEventListener("click", reloadCurrentSource);
document.querySelector("#googleConnectButton").addEventListener("click", loadGoogleEvents);
document.querySelector("#onboardingGoogleButton").addEventListener("click", loadGoogleEvents);
document.querySelector("#onboardingDemoButton").addEventListener("click", () => completeOnboarding("sample"));
document.querySelector("#settingsButton").addEventListener("click", () => showView("settings"));
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
  activateSource(state.source);
  showView("home");
  renderHome();
} else {
  showView("onboarding");
}
bootDesktopRuntime();
startAutoStartScheduler();
startGoogleAutoSync();
if (window.SlowIndexElectron?.isElectron) {
  window.SlowIndexElectron.onStartSlow(startSlowFromExternalTrigger);
}
syncReminderBackends();
