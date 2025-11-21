// Simple quiz engine with domain filtering and local progress save
let allQuestions = [];
let quizQuestions = [];
let currentIndex = 0;
let score = 0;

const el = (id) => document.getElementById(id);

async function init() {
  const res = await fetch("questions.json");
  allQuestions = await res.json();
  console.log(`Loaded ${allQuestions.length} questions`);
  renderDomainFilters();
  attachHandlers();
  loadProgress();
}

function renderDomainFilters() {
  const domains = [...new Set(allQuestions.map((q) => q.domain))];
  const container = el("domain-list");
  container.innerHTML = "";
  domains.forEach((d, i) => {
    const div = document.createElement("div");
    div.className = "domain-item";
    div.innerHTML = `<input type='checkbox' data-domain='${d}' id='dom-${i}' checked> <label for='dom-${i}'>${d}</label>`;
    container.appendChild(div);
  });
}

function attachHandlers() {
  el("start-btn").addEventListener("click", startQuiz);
  el("next-btn").addEventListener("click", nextQuestion);
  el("show-explanation").addEventListener("click", () => {
    el("explanation").classList.toggle("hidden");
  });
  el("select-all").addEventListener("click", () => {
    document
      .querySelectorAll("#domain-list input")
      .forEach((i) => (i.checked = true));
  });
  el("clear-all").addEventListener("click", () => {
    document
      .querySelectorAll("#domain-list input")
      .forEach((i) => (i.checked = false));
  });
  el("reset-progress").addEventListener("click", () => {
    if (confirm("Reset saved progress?")) {
      localStorage.removeItem("sq_progress");
      location.reload();
    }
  });
  el("retry-btn")?.addEventListener("click", () => {
    location.reload();
  });
}

function startQuiz() {
  const selectedDomains = Array.from(
    document.querySelectorAll("#domain-list input:checked")
  ).map((i) => i.dataset.domain);
  let count = parseInt(el("num-questions").value) || 20;
  if (selectedDomains.length === 0) {
    alert("Select at least one domain.");
    return;
  }
  quizQuestions = allQuestions.filter((q) =>
    selectedDomains.includes(q.domain)
  );
  if (el("shuffle").checked) {
    quizQuestions = shuffleArray(quizQuestions);
  }
  if (quizQuestions.length === 0) {
    alert("No questions available for selected domains");
    return;
  }
  quizQuestions = quizQuestions.slice(0, Math.min(count, quizQuestions.length));
  currentIndex = 0;
  score = 0;
  updateScore();
  el("start-panel").classList.add("hidden");
  el("question-card").classList.remove("hidden");
  renderQuestion();
}

function renderQuestion() {
  const q = quizQuestions[currentIndex];
  el("question-text").innerText = q.question;
  el("question-meta").innerText = `Domain: ${q.domain}`;

  const opts = shuffleArray([...q.options]);
  const optionsDiv = el("options");
  optionsDiv.innerHTML = "";

  opts.forEach((opt) => {
    const b = document.createElement("button");
    b.className = "option-btn";
    b.innerText = opt;
    b.onclick = () => selectOption(b, opt, q);
    optionsDiv.appendChild(b);
  });

  el("progress-text").innerText = `${currentIndex + 1} / ${
    quizQuestions.length
  }`;
  const pct = Math.round((currentIndex / quizQuestions.length) * 100);
  el("progress-fill").style.width = pct + "%";

  // Reset explanation box
  el("explanation").classList.add("hidden");
  el("explanation").innerText = q.explanation || "No explanation provided.";

  // Save progress
  saveProgress();
}

function saveProgress() {
  const data = {
    currentIndex,
    score,
    quizQuestions,
  };
  localStorage.setItem("sq_progress", JSON.stringify(data));
}

function loadProgress() {
  const saved = localStorage.getItem("sq_progress");
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    quizQuestions = data.quizQuestions || [];
    currentIndex = data.currentIndex || 0;
    score = data.score || 0;

    if (quizQuestions.length > 0) {
      el("start-panel").classList.add("hidden");
      el("question-card").classList.remove("hidden");
      renderQuestion();
      updateScore();
    }
  } catch (e) {
    console.error("Failed to load progress", e);
  }
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex >= quizQuestions.length) {
    endQuiz();
  } else {
    renderQuestion();
  }
}

function endQuiz() {
  el("question-card").classList.add("hidden");
  el("end-panel").classList.remove("hidden");
  el("final-score").innerText = `You scored ${score} / ${quizQuestions.length}`;
}

function shuffleArray(array) {
  // Fisher-Yates shuffle
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function selectOption(button, selected, question) {
  // Disable all buttons
  document.querySelectorAll("#options button").forEach((b) => b.disabled = true);

  // Mark correct/incorrect
  if (selected === question.correct) {
    score++;
    button.classList.add("correct");
  } else {
    button.classList.add("incorrect");
    // Highlight the correct answer
    document.querySelectorAll("#options button").forEach((b) => {
      if (b.innerText === question.correct) b.classList.add("correct");
    });
  }

  updateScore();
}

function updateScore() {
  el("score").innerText = `Score: ${score}`;
}

