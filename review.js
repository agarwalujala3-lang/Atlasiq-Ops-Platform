import { getWorkspaces, hydrateNav, hydrateUserCard } from "./shared.js";

const reviewCards = document.getElementById("reviewCards");
const reviewRecommendations = document.getElementById("reviewRecommendations");
const quizList = document.getElementById("quizList");

async function renderReview() {
  const workspaces = await getWorkspaces();
  const outputs = workspaces[0]?.outputs;
  if (!outputs) {
    reviewCards.innerHTML = `<div class="activity-item"><strong>No review data yet</strong><small class="muted">Generate a workspace first.</small></div>`;
    reviewRecommendations.innerHTML = "";
    quizList.innerHTML = "";
    return;
  }

  reviewCards.innerHTML = (outputs.review || []).map((item) => `
    <div class="weak-item">
      <span>${item.title}</span>
      <div class="progress-bar"><div class="progress-fill" style="width:${item.body};"></div></div>
      <strong>${item.body}</strong>
    </div>
  `).join("");

  reviewRecommendations.innerHTML = (outputs.recommendations || []).map((item) => `
    <div class="activity-item"><strong>${item}</strong><small class="muted">Recommended next action</small></div>
  `).join("");

  quizList.innerHTML = (outputs.quiz || []).map((item, index) => `
    <div class="quiz-item">
      <strong>Q${index + 1}. ${item.prompt}</strong>
      <ul>
        ${item.options.map((option) => `<li>${option}</li>`).join("")}
      </ul>
      <small class="muted">Correct answer: ${item.answer}</small>
    </div>
  `).join("");
}

hydrateNav();
hydrateUserCard().then(() => renderReview());

