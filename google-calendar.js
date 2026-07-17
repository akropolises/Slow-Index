const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const GOOGLE_DISCOVERY_URL = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

window.SlowIndexGoogleCalendar = {
  tokenClient: null,
  initialized: false,

  isConfigured() {
    return Boolean(window.SLOW_INDEX_CONFIG?.googleClientId);
  },

  async init() {
    if (!this.isConfigured()) {
      return false;
    }

    await Promise.all([loadGapiClient(), waitForGoogleIdentity()]);
    await gapi.client.init({ discoveryDocs: [GOOGLE_DISCOVERY_URL] });
    await gapi.client.load("calendar", "v3");

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: window.SLOW_INDEX_CONFIG.googleClientId,
      scope: GOOGLE_CALENDAR_SCOPE,
      callback: "",
    });
    this.initialized = true;
    return true;
  },

  async requestAccess() {
    if (!this.initialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      this.tokenClient.callback = (response) => {
        if (response.error) {
          reject(response);
          return;
        }
        resolve(response);
      };
      this.tokenClient.requestAccessToken({ prompt: "" });
    });
  },

  async listTodayEvents() {
    await this.requestAccess();

    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const response = await gapi.client.calendar.events.list({
      calendarId: window.SLOW_INDEX_CONFIG.googleCalendarId || "primary",
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      showDeleted: false,
      singleEvents: true,
      orderBy: "startTime",
    });

    return (response.result.items || [])
      .filter((event) => event.start?.dateTime && event.end?.dateTime)
      .map((event) => {
        const startDate = new Date(event.start.dateTime);
        const endDate = new Date(event.end.dateTime);
        return {
          id: event.id,
          title: event.summary || "予定",
          start: toTimeValue(startDate),
          duration: Math.max(Math.round((endDate - startDate) / 60000), 1),
          source: "google",
        };
      });
  },
};

function loadGapiClient() {
  return new Promise((resolve, reject) => {
    gapi.load("client", {
      callback: resolve,
      onerror: reject,
    });
  });
}

function waitForGoogleIdentity() {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        window.clearInterval(timer);
        resolve();
      }
      if (Date.now() - startedAt > 8000) {
        window.clearInterval(timer);
        reject(new Error("Google Identity Services could not be loaded."));
      }
    }, 50);
  });
}

function toTimeValue(date) {
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}
