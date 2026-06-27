const sessionKey = "atlasiq_ops_session";

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

export function getSession() {
  return safeJsonParse(localStorage.getItem(sessionKey) || "null", null);
}

export function saveSession(session) {
  localStorage.setItem(sessionKey, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(sessionKey);
}

export async function apiFetch(path, options = {}) {
  const session = getSession();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers
  });

  let data = null;
  try {
    data = await response.json();
  } catch (_error) {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.error || "Request failed");
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export async function fetchSession() {
  const session = getSession();
  if (!session?.token) {
    return null;
  }
  try {
    const data = await apiFetch("/api/auth/session", { method: "GET" });
    const next = { token: session.token, user: data.user };
    saveSession(next);
    return next;
  } catch (_error) {
    clearSession();
    return null;
  }
}

export async function getWorkspaces() {
  const data = await apiFetch("/api/workspaces", { method: "GET" });
  return data.workspaces || [];
}

export async function saveWorkspaceRecord(workspace) {
  const data = await apiFetch("/api/workspaces", {
    method: "POST",
    body: JSON.stringify(workspace)
  });
  return data.workspace;
}

export function formatSavedTime(value) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function hydrateNav() {
  const current = document.body.dataset.page;
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.page === current);
  });
}

export async function hydrateUserCard() {
  const session = await fetchSession();
  if (!session) {
    window.location.href = "./index.html";
    return null;
  }

  const userIdentity = document.getElementById("userIdentity");
  const userMeta = document.getElementById("userMeta");
  const logoutBtn = document.getElementById("logoutBtn");

  if (userIdentity) {
    userIdentity.textContent = session.user.name;
  }
  if (userMeta) {
    userMeta.textContent = `${session.user.role} | ${session.user.team || "General Team"}`;
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await apiFetch("/api/auth/logout", { method: "POST" });
      } catch (_error) {
        // Clear client session even if the server token is already gone.
      }
      clearSession();
      window.location.href = "./index.html";
    });
  }

  return session;
}

export function exportWorkspace(workspace, format) {
  const outputs = workspace.outputs || {};
  const summary = (outputs.summary || [])
    .map((item) => `${item.label}: ${item.text}`)
    .join("\n");
  const cheat = (outputs.cheat || []).map((item) => `- ${item}`).join("\n");
  const citations = (outputs.citations || [])
    .map((item) => `- ${item.title} (${item.source}): ${item.note}`)
    .join("\n");

  let content = "";
  let mime = "text/plain";
  let extension = "txt";

  if (format === "json") {
    content = JSON.stringify(workspace, null, 2);
    mime = "application/json";
    extension = "json";
  } else if (format === "markdown") {
    content = `# ${workspace.title}\n\n## Structured Summary\n${summary}\n\n## Cheat Notes\n${cheat}\n\n## Citations\n${citations}\n`;
    mime = "text/markdown";
    extension = "md";
  } else {
    content = `${workspace.title}\n\nStructured Summary\n${summary}\n\nCheat Notes\n${cheat}\n\nCitations\n${citations}\n`;
  }

  const blob = new Blob([content], { type: mime });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${workspace.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

