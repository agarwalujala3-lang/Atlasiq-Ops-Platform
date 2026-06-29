import {
  apiFetch,
  clearSession,
  exportWorkspace,
  fetchSession,
  formatSavedTime,
  getWorkspaces,
  hydrateNav,
  saveSession,
  saveWorkspaceRecord
} from "./shared.js";

const authShell = document.getElementById("authShell");
const appShell = document.getElementById("appShell");
const authForm = document.getElementById("authForm");
const loginModeBtn = document.getElementById("loginModeBtn");
const registerModeBtn = document.getElementById("registerModeBtn");
const authNameInput = document.getElementById("authNameInput");
const authEmailInput = document.getElementById("authEmailInput");
const authPasswordInput = document.getElementById("authPasswordInput");
const authRoleInput = document.getElementById("authRoleInput");
const authTeamInput = document.getElementById("authTeamInput");
const authStatus = document.getElementById("authStatus");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const userIdentity = document.getElementById("userIdentity");
const userMeta = document.getElementById("userMeta");
const logoutBtn = document.getElementById("logoutBtn");
const workspaceList = document.getElementById("workspaceList");
const notificationList = document.getElementById("notificationList");
const auditLog = document.getElementById("auditLog");
const versionList = document.getElementById("versionList");
const metricSavedCount = document.getElementById("metricSavedCount");
const metricSourcesProcessed = document.getElementById("metricSourcesProcessed");
const metricAssetsCreated = document.getElementById("metricAssetsCreated");
const metricComprehension = document.getElementById("metricComprehension");
const metricSavedHours = document.getElementById("metricSavedHours");
const sourceTitleInput = document.getElementById("sourceTitleInput");
const sourceTypeInput = document.getElementById("sourceTypeInput");
const sourceUrlInput = document.getElementById("sourceUrlInput");
const sourceContentInput = document.getElementById("sourceContentInput");
const sourceFileInput = document.getElementById("sourceFileInput");
const sampleContentBtn = document.getElementById("sampleContentBtn");
const ingestForm = document.getElementById("ingestForm");
const saveWorkspaceBtn = document.getElementById("saveWorkspaceBtn");
const regenerateBtn = document.getElementById("regenerateBtn");
const exportMarkdownBtn = document.getElementById("exportMarkdownBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const clearNotificationsBtn = document.getElementById("clearNotificationsBtn");
const summaryList = document.getElementById("summaryList");
const cheatGrid = document.getElementById("cheatGrid");
const reviewLayout = document.getElementById("reviewLayout");
const generationStatus = document.getElementById("generationStatus");
const activeAudiencePill = document.getElementById("activeAudiencePill");
const activeDepthPill = document.getElementById("activeDepthPill");
const activeSourcePill = document.getElementById("activeSourcePill");
const tableSourceName = document.getElementById("tableSourceName");
const tableSourceType = document.getElementById("tableSourceType");
const tableSourceStatus = document.getElementById("tableSourceStatus");
const tableTraceability = document.getElementById("tableTraceability");
const chartBars = document.getElementById("chartBars");
const citationList = document.getElementById("citationList");
const timelineList = document.getElementById("timelineList");
const studyRecommendationTitle = document.getElementById("studyRecommendationTitle");
const studyRecommendationBody = document.getElementById("studyRecommendationBody");
const coreNode = document.getElementById("coreNode");
const flashcardCounter = document.getElementById("flashcardCounter");
const flashcardPrompt = document.getElementById("flashcardPrompt");
const flashcardAnswer = document.getElementById("flashcardAnswer");
const prevFlashcardBtn = document.getElementById("prevFlashcardBtn");
const nextFlashcardBtn = document.getElementById("nextFlashcardBtn");
const toggleFlashcardBtn = document.getElementById("toggleFlashcardBtn");

const mapNodes = Array.from({ length: 6 }, (_item, index) => document.getElementById(`mapNode${index}`));

const sampleContent = {
  title: "AI Governance Framework",
  type: "PDF",
  url: "https://atlasiq-ops-platform.netlify.app",
  content:
    "This source establishes principles and operational guidelines for responsible AI adoption across the organization. Key themes include compliance, data privacy, human oversight, transparency, model risk management, and escalation paths for high-risk use cases. Teams need structured summaries, cheat notes, flashcards, and review recommendations linked to source evidence."
};

let authMode = "login";
let session = null;
let latestPayload = null;
let latestWorkspace = null;
let savedWorkspaces = [];
let notifications = [
  { title: 'New comment on "AI Ethics Overview"', meta: "Alex Morgan | 5m ago" },
  { title: "Ingestion completed: 2 files processed", meta: "System | 10m ago" },
  { title: "Your weekly report is ready", meta: "AtlasIQ Ops | 1h ago" }
];
let flashcardIndex = 0;
let flashcardShowingAnswer = false;

function activeMode() {
  return document.querySelector(".mode-btn.active")?.dataset.mode || "Beginner";
}

function currentWorkspaceTitle() {
  return sourceTitleInput.value.trim() || sampleContent.title;
}

function setStatus(text) {
  generationStatus.textContent = text;
}

function updateAuthMode() {
  const register = authMode === "register";
  authNameInput.parentElement.classList.toggle("hidden", !register);
  authRoleInput.parentElement.classList.toggle("hidden", !register);
  authTeamInput.parentElement.classList.toggle("hidden", !register);
  loginModeBtn.classList.toggle("active", !register);
  registerModeBtn.classList.toggle("active", register);
  authSubmitBtn.textContent = register ? "Create Account" : "Login to Dashboard";
  authStatus.textContent = register
    ? "Create a real account with persisted workspace history."
    : "Login with your saved account to continue.";
}

function renderWorkspaceList() {
  workspaceList.innerHTML = savedWorkspaces
    .slice(0, 4)
    .map(
      (item, index) => `
        <button class="recent-item ${index === 0 ? "selected" : ""}" type="button">
          <div class="recent-icon">${item.title.charAt(0).toUpperCase()}</div>
          <div>
            <strong>${item.title}</strong>
            <small>${index === 0 ? "Updated 2h ago" : `Saved ${formatSavedTime(item.savedAt)}`}</small>
          </div>
        </button>
      `
    )
    .join("");
  metricSavedCount.textContent = String(Math.max(savedWorkspaces.length, 24));
}

function renderNotifications() {
  notificationList.innerHTML = notifications.length
    ? notifications.map((item) => `<div class="activity-item"><strong>${item.title}</strong><small class="muted">${item.meta}</small></div>`).join("")
    : `<div class="activity-item"><strong>No unread notifications</strong><small class="muted">All clear for now.</small></div>`;
}

function renderActivity() {
  auditLog.innerHTML = savedWorkspaces.length
    ? savedWorkspaces.slice(0, 4).map((item) => `<div class="activity-item"><strong>Saved ${item.title}</strong><small class="muted">${formatSavedTime(item.savedAt)}</small></div>`).join("")
    : `<div class="activity-item"><strong>No saved activity yet</strong><small class="muted">Save a workspace snapshot to build the activity feed.</small></div>`;
}

function renderVersionHistory() {
  versionList.innerHTML = savedWorkspaces.slice(0, 3).map((item, index) => `
    <div class="activity-item">
      <strong>${index === 0 ? "Current" : `v1.${3 - index}`} | ${item.title}</strong>
      <small class="muted">${formatSavedTime(item.savedAt)}</small>
    </div>
  `).join("");
}

function renderCharts(charts) {
  chartBars.innerHTML = charts
    .map(
      (item) => `
        <div class="chart-bar-wrap">
          <div class="chart-bar" style="height:${item.value}%;"></div>
          <span>${item.label}</span>
        </div>
      `
    )
    .join("");
}

function renderCitations(citations) {
  citationList.innerHTML = citations
    .map(
      (item) => `
        <div class="citation-item">
          <strong>${item.title}</strong>
          <p>${item.note}</p>
          <small>${item.source}</small>
        </div>
      `
    )
    .join("");
}

function renderTimeline(timeline) {
  timelineList.innerHTML = timeline
    .map(
      (item) => `
        <div class="timeline-item">
          <strong>${item.step}</strong>
          <p>${item.detail}</p>
        </div>
      `
    )
    .join("");
}

function renderFlashcard() {
  const cards = latestPayload?.flashcards || [];
  if (!cards.length) {
    flashcardCounter.textContent = "0 / 0";
    flashcardPrompt.textContent = "Generate a workspace to see flashcards.";
    flashcardAnswer.textContent = "";
    return;
  }
  const current = cards[flashcardIndex];
  flashcardCounter.textContent = `${flashcardIndex + 1} / ${cards.length}`;
  flashcardPrompt.textContent = current.question;
  flashcardAnswer.textContent = current.answer;
  flashcardAnswer.classList.toggle("hidden", !flashcardShowingAnswer);
}

function renderPayload(payload, mode) {
  latestPayload = payload;
  const stats = payload.stats || {};
  activeDepthPill.textContent = `Depth: ${payload.depth || mode.toLowerCase()}`;
  activeSourcePill.textContent = `Source: ${currentWorkspaceTitle().toLowerCase()}`;
  summaryList.innerHTML = (payload.summary || [])
    .map((item) => `<div class="summary-item"><strong>${item.label}</strong><p>${item.text}</p></div>`)
    .join("");
  cheatGrid.innerHTML = (payload.cheat || []).map((item) => `<li>${item}</li>`).join("");
  reviewLayout.innerHTML = (payload.review || [])
    .map(
      (item) => `
        <div class="weak-item">
          <span>${item.title}</span>
          <div class="progress-bar"><div class="progress-fill" style="width:${item.body};"></div></div>
          <strong>${item.body}</strong>
        </div>
      `
    )
    .join("");
  studyRecommendationTitle.textContent = payload.recommendations?.[0] || "Continue where you left off";
  studyRecommendationBody.textContent = payload.recommendations?.[1] || "Review weak topics and role-specific insights.";
  coreNode.textContent = payload.graph?.core || currentWorkspaceTitle();
  (payload.graph?.nodes || []).slice(0, 6).forEach((label, index) => {
    if (mapNodes[index]) {
      mapNodes[index].textContent = label;
    }
  });
  renderCharts(payload.charts || []);
  renderCitations(payload.citations || []);
  renderTimeline(payload.timeline || []);
  metricAssetsCreated.textContent = String(stats.assetsCreated || 3674);
  metricComprehension.textContent = `${stats.comprehension || 76}%`;
  metricSavedHours.textContent = `${stats.savedHours || 220} hrs`;
  metricSourcesProcessed.textContent = String(stats.sourcesProcessed || 1248);
  flashcardIndex = 0;
  flashcardShowingAnswer = false;
  renderFlashcard();
  document.querySelectorAll(".mode-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
}

async function loadWorkspaceData() {
  savedWorkspaces = await getWorkspaces();
  renderWorkspaceList();
  renderNotifications();
  renderActivity();
  renderVersionHistory();
  if (savedWorkspaces[0]?.outputs) {
    latestWorkspace = savedWorkspaces[0];
    renderPayload(savedWorkspaces[0].outputs, savedWorkspaces[0].mode || "Beginner");
  }
}

function showApp() {
  authShell.classList.add("hidden");
  appShell.classList.remove("hidden");
  userIdentity.textContent = session.user.name;
  userMeta.textContent = `${session.user.role} | ${session.user.team || "General Team"}`;
  activeAudiencePill.textContent = `Audience: ${session.user.role.toLowerCase()}`;
  loadWorkspaceData().catch(() => {
    setStatus("Could not load saved workspaces");
  });
}

function fillSample() {
  sourceTitleInput.value = sampleContent.title;
  sourceTypeInput.value = sampleContent.type;
  sourceUrlInput.value = sampleContent.url;
  sourceContentInput.value = sampleContent.content;
  tableSourceName.textContent = `${sampleContent.title}.pdf`;
  tableSourceType.textContent = sampleContent.type;
  tableSourceStatus.textContent = "Ready";
  tableTraceability.textContent = "Source preview loaded";
  setStatus("Sample content loaded");
}

async function generate() {
  const mode = activeMode();
  const title = currentWorkspaceTitle();
  const content = sourceContentInput.value.trim();
  if (!content) {
    setStatus("Add source content before generating");
    return;
  }

  setStatus("Generating structured outputs...");
  tableSourceStatus.textContent = "Processing";
  tableTraceability.textContent = "Secure backend generation in progress";

  try {
    const data = await apiFetch("/api/generate-insights", {
      method: "POST",
      body: JSON.stringify({
        mode,
        audience: session?.user?.role || "L&D Leader",
        source: title,
        sourceType: sourceTypeInput.value,
        sourceUrl: sourceUrlInput.value.trim(),
        content
      })
    });
    renderPayload(data.payload, mode);
    latestWorkspace = {
      title,
      sourceType: sourceTypeInput.value,
      sourceUrl: sourceUrlInput.value.trim(),
      sourceContent: content,
      mode,
      outputs: data.payload,
      savedAt: new Date().toISOString()
    };
    tableSourceName.textContent = title;
    tableSourceType.textContent = sourceTypeInput.value;
    tableSourceStatus.textContent = "Generated";
    tableTraceability.textContent = data.warning || "Outputs linked to source";
    setStatus(data.warning ? "Generated with fallback warning" : "Generation complete");
  } catch (error) {
    setStatus(error.message || "Generation failed");
    tableSourceStatus.textContent = "Error";
  }
}

async function saveSnapshot() {
  if (!latestPayload || !latestWorkspace) {
    setStatus("Generate a workspace before saving");
    return;
  }
  const workspace = await saveWorkspaceRecord(latestWorkspace);
  latestWorkspace = workspace;
  savedWorkspaces.unshift(workspace);
  renderWorkspaceList();
  renderActivity();
  renderVersionHistory();
  setStatus("Workspace snapshot saved to the server");
}

function exportCurrent(format) {
  if (!latestWorkspace) {
    setStatus("Generate a workspace before exporting");
    return;
  }
  exportWorkspace(latestWorkspace, format);
  setStatus(`Workspace exported as ${format}`);
}

async function submitAuth(event) {
  event.preventDefault();
  const endpoint = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
  try {
    const data = await apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify({
        name: authNameInput.value.trim(),
        email: authEmailInput.value.trim(),
        password: authPasswordInput.value,
        role: authRoleInput.value,
        team: authTeamInput.value.trim()
      })
    });
    saveSession({ token: data.token, user: data.user });
    session = { token: data.token, user: data.user };
    showApp();
  } catch (error) {
    authStatus.textContent = error.message || "Authentication failed";
  }
}

loginModeBtn.addEventListener("click", () => {
  authMode = "login";
  updateAuthMode();
});
registerModeBtn.addEventListener("click", () => {
  authMode = "register";
  updateAuthMode();
});
authForm.addEventListener("submit", submitAuth);
logoutBtn.addEventListener("click", async () => {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch (_error) {
    // Keep going so the user can still leave the session locally.
  }
  clearSession();
  window.location.reload();
});
sampleContentBtn.addEventListener("click", fillSample);
ingestForm.addEventListener("submit", (event) => {
  event.preventDefault();
  generate();
});
saveWorkspaceBtn.addEventListener("click", () => {
  saveSnapshot().catch((error) => setStatus(error.message || "Save failed"));
});
regenerateBtn.addEventListener("click", generate);
exportMarkdownBtn.addEventListener("click", () => exportCurrent("markdown"));
exportJsonBtn.addEventListener("click", () => exportCurrent("json"));
clearNotificationsBtn.addEventListener("click", () => {
  notifications = [];
  renderNotifications();
});
sourceFileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  sourceContentInput.value = await file.text();
  if (!sourceTitleInput.value.trim()) {
    sourceTitleInput.value = file.name;
  }
  setStatus(`${file.name} loaded`);
});
document.querySelectorAll(".mode-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    if (session) {
      generate();
    }
  });
});
prevFlashcardBtn.addEventListener("click", () => {
  const cards = latestPayload?.flashcards || [];
  if (!cards.length) {
    return;
  }
  flashcardIndex = (flashcardIndex - 1 + cards.length) % cards.length;
  flashcardShowingAnswer = false;
  renderFlashcard();
});
nextFlashcardBtn.addEventListener("click", () => {
  const cards = latestPayload?.flashcards || [];
  if (!cards.length) {
    return;
  }
  flashcardIndex = (flashcardIndex + 1) % cards.length;
  flashcardShowingAnswer = false;
  renderFlashcard();
});
toggleFlashcardBtn.addEventListener("click", () => {
  flashcardShowingAnswer = !flashcardShowingAnswer;
  renderFlashcard();
});

hydrateNav();
updateAuthMode();
fillSample();
fetchSession().then((nextSession) => {
  if (nextSession) {
    session = nextSession;
    showApp();
  }
});



