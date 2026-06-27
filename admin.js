import { apiFetch, hydrateNav, hydrateUserCard } from "./shared.js";

const serverHealth = document.getElementById("serverHealth");
const serverHealthCopy = document.getElementById("serverHealthCopy");

async function loadHealth() {
  try {
    const data = await apiFetch("/api/health", { method: "GET" });
    serverHealth.textContent = data.ok ? "Healthy" : "Unavailable";
    serverHealthCopy.textContent = `Model: ${data.model} | Rate limit: ${data.rateLimitMax}/min | Key configured: ${data.hasOpenAIKey ? "Yes" : "No"} | Users: ${data.users} | Workspaces: ${data.workspaces}`;
  } catch (_error) {
    serverHealth.textContent = "Unavailable";
    serverHealthCopy.textContent = "Server health check failed.";
  }
}

hydrateNav();
hydrateUserCard().then(() => loadHealth());
