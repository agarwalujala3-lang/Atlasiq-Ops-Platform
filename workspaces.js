import { downloadAuthenticatedFile, exportWorkspace, formatSavedTime, getWorkspaces, hydrateNav, hydrateUserCard } from "./shared.js";

const savedWorkspaceGrid = document.getElementById("savedWorkspaceGrid");
const workspaceTotal = document.getElementById("workspaceTotal");

async function renderWorkspaces() {
  const saved = await getWorkspaces();
  workspaceTotal.textContent = String(saved.length);
  savedWorkspaceGrid.innerHTML = saved.length
    ? saved.map((item) => `
      <article class="workspace-card">
        <div class="workspace-card-head">
          <div>
            <h3>${item.title}</h3>
            <p class="muted">${item.sourceType} | Saved ${formatSavedTime(item.savedAt)}</p>
          </div>
          <span class="status-pill success">${item.mode || "Beginner"}</span>
        </div>
        <div class="workspace-meta-grid">
          <div><span class="mini-label">Summary blocks</span><strong>${item.outputs?.summary?.length || 0}</strong></div>
          <div><span class="mini-label">Flashcards</span><strong>${item.outputs?.flashcards?.length || 0}</strong></div>
          <div><span class="mini-label">Citations</span><strong>${item.outputs?.citations?.length || 0}</strong></div>
        </div>
        <div class="workspace-snippet">${item.outputs?.summary?.[0]?.text || "No summary available."}</div>
        <div class="toolbar-row">
          <button class="btn btn-primary export-btn" data-id="${item.id}" data-format="pdf" type="button">Export PDF</button>
          <button class="btn btn-soft export-btn" data-id="${item.id}" data-format="markdown" type="button">Export MD</button>
          <button class="btn btn-ghost export-btn" data-id="${item.id}" data-format="json" type="button">Export JSON</button>
        </div>
      </article>
    `).join("")
    : `<article class="panel"><strong>No workspaces saved yet</strong><p class="muted">Generate insights from the dashboard and save a snapshot to see it here.</p></article>`;

  document.querySelectorAll(".export-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const workspace = saved.find((item) => item.id === button.dataset.id);
      if (!workspace) {
        return;
      }
      if (button.dataset.format === "pdf") {
        await downloadAuthenticatedFile(
          `/api/workspaces/${workspace.id}/export/pdf`,
          `${workspace.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`
        );
        return;
      }
      exportWorkspace(workspace, button.dataset.format);
    });
  });
}

hydrateNav();
hydrateUserCard().then(() => renderWorkspaces());
