import { getWorkspaces, hydrateNav, hydrateUserCard } from "./shared.js";

const reportSavedHours = document.getElementById("reportSavedHours");
const reportComprehension = document.getElementById("reportComprehension");
const reportAssets = document.getElementById("reportAssets");
const reportChartBars = document.getElementById("reportChartBars");
const reportRecommendations = document.getElementById("reportRecommendations");
const reportCitations = document.getElementById("reportCitations");

async function renderReports() {
  const workspaces = await getWorkspaces();
  const outputs = workspaces[0]?.outputs;
  if (!outputs) {
    return;
  }

  reportSavedHours.textContent = `${outputs.stats?.savedHours || 220} hrs`;
  reportComprehension.textContent = `${outputs.stats?.comprehension || 76}%`;
  reportAssets.textContent = String(outputs.stats?.assetsCreated || 3674);

  reportChartBars.innerHTML = (outputs.charts || []).map((item) => `
    <div class="chart-bar-wrap">
      <div class="chart-bar" style="height:${item.value}%;"></div>
      <span>${item.label}</span>
    </div>
  `).join("");

  reportRecommendations.innerHTML = (outputs.recommendations || []).map((item) => `
    <div class="activity-item"><strong>${item}</strong><small class="muted">Recommended next step</small></div>
  `).join("");

  reportCitations.innerHTML = (outputs.citations || []).map((item) => `
    <div class="citation-item"><strong>${item.title}</strong><p>${item.note}</p><small>${item.source}</small></div>
  `).join("");
}

hydrateNav();
hydrateUserCard().then(() => renderReports());

