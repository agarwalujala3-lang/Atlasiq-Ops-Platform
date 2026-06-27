import { exportWorkspace, getWorkspaces, hydrateNav, hydrateUserCard } from "./shared.js";

const exportMarkdownPageBtn = document.getElementById("exportMarkdownPageBtn");
const exportJsonPageBtn = document.getElementById("exportJsonPageBtn");

async function exportLatest(format) {
  const workspaces = await getWorkspaces();
  const workspace = workspaces[0];
  if (!workspace) {
    return;
  }
  exportWorkspace(workspace, format);
}

exportMarkdownPageBtn.addEventListener("click", () => {
  exportLatest("markdown");
});

exportJsonPageBtn.addEventListener("click", () => {
  exportLatest("json");
});

hydrateNav();
hydrateUserCard();

