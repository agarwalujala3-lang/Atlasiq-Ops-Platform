import { downloadAuthenticatedFile, exportWorkspace, getWorkspaces, hydrateNav, hydrateUserCard } from "./shared.js";

const exportPdfPageBtn = document.getElementById("exportPdfPageBtn");
const exportMarkdownPageBtn = document.getElementById("exportMarkdownPageBtn");
const exportJsonPageBtn = document.getElementById("exportJsonPageBtn");

async function exportLatest(format) {
  const workspaces = await getWorkspaces();
  const workspace = workspaces[0];
  if (!workspace) {
    return;
  }
  if (format === "pdf") {
    await downloadAuthenticatedFile(
      `/api/workspaces/${workspace.id}/export/pdf`,
      `${workspace.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`
    );
    return;
  }
  exportWorkspace(workspace, format);
}

if (exportPdfPageBtn) {
  exportPdfPageBtn.addEventListener("click", () => {
    exportLatest("pdf");
  });
}

exportMarkdownPageBtn.addEventListener("click", () => {
  exportLatest("markdown");
});

exportJsonPageBtn.addEventListener("click", () => {
  exportLatest("json");
});

hydrateNav();
hydrateUserCard();
