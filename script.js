const typingSamples = [
  "the little brown dog runs across the park and jumps near the red bench",
  "my friend brought chips and juice so we sat outside and talked after school",
  "simple websites can still be fun when the colors buttons and tools feel friendly",
  "today i want to finish this project and show everyone the cool tools on my page",
  "coding gets easier when each page has one clear job and simple buttons to press",
  "the bus arrived early so we grabbed our bags quickly and laughed all the way to class",
  "bright colors and playful shapes can make a tiny website feel more alive and fun to use",
  "some people type faster when they relax their hands and stop trying to hit every key too hard",
  "a good typing test shows both speed and accuracy because mistakes can slow you down a lot",
  "after lunch we opened the laptops tested the tools and compared our scores for ten minutes",
  "building fun projects is easier when the design is simple the buttons are clear and the goal is obvious",
  "my cousin likes rhythm games because quick fingers and clean timing make every round feel better",
  "small improvements every day can turn slow typing into smooth typing after enough practice",
  "the room was quiet except for keyboards clicking softly while everyone tried to beat their best score",
  "when a page feels friendly and colorful people usually stay longer and try more things on it",
  "practice matters more than luck in typing because your hands slowly learn the patterns over time",
  "the fastest round is not always the best round if the sentence is full of mistakes and missed spaces",
  "some keyboards feel light and quick while others feel heavy and make long tests harder to finish",
  "we kept testing random sentences until somebody finally reached a score that made the whole group cheer",
  "a clean layout helps people focus on the text instead of getting distracted by too many extra details"
];

function createCountdown(totalSeconds, onTick, onDone) {
  let startTime = 0;
  let rafId = 0;
  let running = false;

  function frame(now) {
    if (!running) return;
    const elapsedSeconds = (now - startTime) / 1000;
    const remainingPrecise = Math.max(0, totalSeconds - elapsedSeconds);
    const displayedSeconds = Math.max(0, totalSeconds - Math.floor(elapsedSeconds));
    onTick(displayedSeconds, remainingPrecise, elapsedSeconds);
    if (remainingPrecise <= 0) {
      running = false;
      rafId = 0;
      onDone(totalSeconds);
      return;
    }
    rafId = requestAnimationFrame(frame);
  }

  return {
    start() {
      this.stop();
      running = true;
      startTime = performance.now();
      onTick(totalSeconds, totalSeconds, 0);
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    },
    isRunning() {
      return running;
    }
  };
}

function getSavedPlayerName() {
  return localStorage.getItem("tech_premi_player_name") || "";
}

function setSavedPlayerName(name) {
  const trimmed = String(name || "").trim().slice(0, 18);
  const existing = getSavedPlayerName();
  if (existing) {
    return { ok: existing === trimmed, locked: true, name: existing };
  }
  if (!trimmed) {
    return { ok: false, locked: false, name: "" };
  }
  localStorage.setItem("tech_premi_player_name", trimmed);
  return { ok: true, locked: true, name: trimmed };
}

function syncLeaderboardPlayerState() {
  const savedName = getSavedPlayerName().trim();
  const locked = Boolean(savedName);
  document.querySelectorAll('.leaderboard-player-input').forEach((input) => {
    input.value = savedName;
    input.disabled = locked;
  });
  document.querySelectorAll('.leaderboard-save-name').forEach((button) => {
    button.disabled = locked;
    button.textContent = locked ? 'Name saved' : 'Save name';
  });
  document.querySelectorAll('.leaderboard-player-note').forEach((note) => {
    note.textContent = locked
      ? `Playing globally as ${savedName}. This device is locked to one name, and your rank changes only when you beat your own best score.`
      : 'Save one name for this device. After that, keep replaying and your rank will only change when you beat your own best score.';
  });
}

async function leaderboardRequest(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Leaderboard request failed.");
  }
  return data;
}

function ensureResultModal() {
  let modal = document.getElementById("result-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "result-modal";
  modal.className = "result-modal hidden";
  modal.innerHTML = `
    <div class="result-modal-card" role="dialog" aria-modal="true" aria-labelledby="result-modal-title">
      <p class="result-modal-kicker">Test finished</p>
      <h2 id="result-modal-title" class="result-modal-title">Result</h2>
      <p class="result-modal-value" id="result-modal-value">0</p>
      <p class="result-modal-subtext" id="result-modal-subtext"></p>
      <div class="result-modal-rank" id="result-modal-rank">
        <p class="result-modal-hint" id="result-modal-rank-text"></p>
      </div>
      <p class="result-modal-save-note" id="result-modal-save-note"></p>
      <button class="action-button result-modal-button" id="result-modal-retest" type="button">Retest</button>
    </div>
  `;

  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.classList.add("hidden");
  });

  document.body.appendChild(modal);
  return modal;
}

function hideResultModal() {
  const modal = document.getElementById("result-modal");
  if (modal) modal.classList.add("hidden");
}

function resolveLeaderboardValue(value) {
  return typeof value === "function" ? value() : value;
}

function ensureLeaderboardCard(game, title) {
  const panel = document.querySelector("main.panel");
  if (!panel) return null;

  let card = document.getElementById(`${game}-leaderboard`);
  if (!card) {
    card = document.createElement("section");
    card.id = `${game}-leaderboard`;
    card.className = "leaderboard-card";
    card.innerHTML = `
      <div class="leaderboard-head">
        <div>
          <p class="leaderboard-kicker">Global Leaderboard</p>
          <h2></h2>
        </div>
      </div>
      <div class="leaderboard-player">
        <label class="leaderboard-player-label" for="${game}-player-name">Player name</label>
        <div class="leaderboard-player-row">
          <input id="${game}-player-name" class="leaderboard-player-input" type="text" maxlength="18" placeholder="Enter one name for this device">
          <button class="action-button leaderboard-save-name" type="button">Save name</button>
        </div>
        <p class="leaderboard-player-note"></p>
      </div>
      <div class="leaderboard-list"></div>
    `;
    const article = panel.querySelector(".article-box");
    if (article) panel.insertBefore(card, article);
    else panel.appendChild(card);

    const input = card.querySelector(".leaderboard-player-input");
    const saveButton = card.querySelector(".leaderboard-save-name");
    const note = card.querySelector(".leaderboard-player-note");

    saveButton.addEventListener("click", () => {
      const existing = getSavedPlayerName().trim();
      if (existing) {
        syncLeaderboardPlayerState();
        return;
      }
      const result = setSavedPlayerName(input.value);
      if (!result.ok) {
        note.textContent = "Enter a name first. One device can save only one name.";
        return;
      }
      syncLeaderboardPlayerState();
    });
  }

  const titleNode = card.querySelector(".leaderboard-head h2");
  if (titleNode) titleNode.textContent = resolveLeaderboardValue(title);
  syncLeaderboardPlayerState();
  return card;
}

async function renderLeaderboard(game, formatter, variant = "default", title, sort = "desc") {
  const card = ensureLeaderboardCard(game, title || game);
  if (!card) return;
  const list = card.querySelector(".leaderboard-list");
  const resolvedVariant = resolveLeaderboardValue(variant) || "default";
  list.innerHTML = '<p class="leaderboard-empty">Loading leaderboard...</p>';
  try {
    const resolvedSort = resolveLeaderboardValue(sort) || "desc";
    const data = await leaderboardRequest(`/api/leaderboard-get?game=${encodeURIComponent(game)}&variant=${encodeURIComponent(resolvedVariant)}&sort=${encodeURIComponent(resolvedSort)}`);
    const entries = Array.isArray(data.entries) ? data.entries : [];
    if (!entries.length) {
      list.innerHTML = '<p class="leaderboard-empty">No ranked scores yet for this duration. Save your name once, then beat your best to appear here.</p>';
      return;
    }
    list.innerHTML = entries.map((entry, index) => `
      <div class="leaderboard-row">
        <strong class="leaderboard-rank">#${index + 1}</strong>
        <div class="leaderboard-meta">
          <span class="leaderboard-name">${entry.name}</span>
          <span class="leaderboard-detail">${entry.detail || ""}</span>
        </div>
        <span class="leaderboard-score">${formatter(entry)}</span>
      </div>
    `).join("");
  } catch (error) {
    list.innerHTML = `<p class="leaderboard-empty">${error.message}</p>`;
  }
}

function setupLeaderboard(game, title, formatter, variant = "default", sort = "desc") {
  ensureLeaderboardCard(game, title);
  const refresh = () => renderLeaderboard(game, formatter, variant, title, sort);
  refresh();
  return refresh;
}

async function submitLeaderboardScore(leaderboard) {
  const name = getSavedPlayerName().trim();
  if (!name) {
    return { skipped: true, message: "Save your player name below to join the global leaderboard." };
  }

  const resolvedVariant = resolveLeaderboardValue(leaderboard.variant) || "default";
  const data = await leaderboardRequest('/api/leaderboard-submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      game: leaderboard.game,
      variant: resolvedVariant,
      name,
      score: leaderboard.score,
      secondaryScore: leaderboard.secondaryScore || 0,
      display: leaderboard.display,
      detail: leaderboard.detail,
      sort: resolveLeaderboardValue(leaderboard.sort) || "desc"
    })
  });

  if (leaderboard.refresh) leaderboard.refresh();
  return data;
}

function showResultModal({ title, value, detail, onRetest, leaderboard }) {
  const modal = ensureResultModal();
  const titleNode = document.getElementById("result-modal-title");
  const valueNode = document.getElementById("result-modal-value");
  const detailNode = document.getElementById("result-modal-subtext");
  const button = document.getElementById("result-modal-retest");
  const rankWrap = document.getElementById("result-modal-rank");
  const rankText = document.getElementById("result-modal-rank-text");
  const saveNote = document.getElementById("result-modal-save-note");

  titleNode.textContent = title;
  valueNode.textContent = value;
  detailNode.textContent = detail || "";
  saveNote.textContent = "";
  rankWrap.classList.remove("hidden");

  if (leaderboard) {
    const savedName = getSavedPlayerName().trim();
    rankText.textContent = savedName
      ? `Playing globally as ${savedName}. This device keeps one name only, and your rank changes only when you beat your own best score.`
      : "Save one player name in the leaderboard card below to join the global leaderboard from this device.";
    if (savedName) {
      submitLeaderboardScore(leaderboard)
        .then((result) => {
          if (result.skipped) saveNote.textContent = result.message;
          else if (result.updated) saveNote.textContent = result.message || "Personal best updated on the leaderboard.";
          else saveNote.textContent = result.message || "Your rank stays the same until you beat your own best score.";
        })
        .catch((error) => {
          saveNote.textContent = error.message;
        });
    }
  } else {
    rankWrap.classList.add("hidden");
  }

  button.onclick = () => {
    modal.classList.add("hidden");
    if (onRetest) onRetest();
  };

  modal.classList.remove("hidden");
}
function setupCps() {
  const button = document.getElementById("cps-button");
  if (!button) return;
  const durationInput = document.getElementById("cps-duration");
  const timeOutput = document.getElementById("cps-time");
  const clicksOutput = document.getElementById("cps-clicks");
  const scoreOutput = document.getElementById("cps-score");
  const resetButton = document.getElementById("cps-reset");
  const leaderboardVariant = () => `${durationInput.value}s`;
  const leaderboardTitle = () => `Top CPS (${durationInput.value}s)`;
  const refreshLeaderboard = setupLeaderboard("cps", leaderboardTitle, (entry) => entry.display || `${entry.score.toFixed(2)} CPS`, leaderboardVariant);
  let clicks = 0;
  let finished = false;
  let elapsed = 0;
  let timer = null;

  function liveCps() {
    if (clicks === 0) return 0;
    return clicks / Math.max(elapsed, 1);
  }

  function resetTest() {
    hideResultModal();
    if (timer) timer.stop();
    clicks = 0;
    finished = false;
    elapsed = 0;
    timeOutput.textContent = durationInput.value;
    clicksOutput.textContent = "0";
    scoreOutput.textContent = "0.00";
    button.textContent = "start clicking";
  }

  function buildTimer() {
    timer = createCountdown(Number(durationInput.value), (shown, _r, passed) => {
      elapsed = passed;
      timeOutput.textContent = String(shown);
      scoreOutput.textContent = liveCps().toFixed(2);
    }, (total) => {
      elapsed = total;
      finished = true;
      const finalScore = Number((clicks / total).toFixed(2));
      timeOutput.textContent = "0";
      scoreOutput.textContent = finalScore.toFixed(2);
      button.textContent = "done - click again";
      showResultModal({
        title: "CPS Result",
        value: `${finalScore.toFixed(2)} CPS`,
        detail: `${clicks} clicks in ${total} seconds`,
        onRetest: resetTest,
        leaderboard: {
          game: "cps",
          score: finalScore,
          display: `${finalScore.toFixed(2)} CPS`,
          detail: `${clicks} clicks in ${total}s`,
          variant: leaderboardVariant,
          refresh: refreshLeaderboard
        }
      });
    });
  }

  button.addEventListener("click", () => {
    if (!timer || finished || !timer.isRunning()) {
      resetTest();
      buildTimer();
      timer.start();
    }
    if (finished) return;
    clicks += 1;
    clicksOutput.textContent = String(clicks);
    scoreOutput.textContent = liveCps().toFixed(2);
    button.textContent = "keep clicking";
  });

  durationInput.addEventListener("change", () => {
    resetTest();
    refreshLeaderboard();
  });
  resetButton.addEventListener("click", resetTest);
  resetTest();
}
function setupWpm() {
  const input = document.getElementById("wpm-input");
  if (!input) return;
  const durationInput = document.getElementById("wpm-duration");
  const textOutput = document.getElementById("wpm-text");
  const timeOutput = document.getElementById("wpm-time");
  const scoreOutput = document.getElementById("wpm-score");
  const accuracyOutput = document.getElementById("wpm-accuracy");
  const resetButton = document.getElementById("wpm-reset");
  const leaderboardVariant = () => `${durationInput.value}s`;
  const leaderboardTitle = () => `Top WPM (${durationInput.value}s)`;
  const refreshLeaderboard = setupLeaderboard("wpm", leaderboardTitle, (entry) => entry.display || `${entry.score} WPM`, leaderboardVariant);
  let elapsed = 0;
  let timer = null;

  function pickText() {
    return typingSamples[Math.floor(Math.random() * typingSamples.length)];
  }

  function countCorrect(sample, typed) {
    let total = 0;
    for (let i = 0; i < typed.length; i += 1) {
      if (typed[i] === sample[i]) total += 1;
    }
    return total;
  }

  function calculateStats() {
    const sample = textOutput.textContent;
    const typed = input.value;
    const correct = countCorrect(sample, typed);
    const grossChars = typed.length;
    const safeElapsedMinutes = Math.max(elapsed / 60, 10 / 60);
    const grossWpm = (grossChars / 5) / safeElapsedMinutes;
    const accuracy = typed.length === 0 ? 100 : Math.round((correct / typed.length) * 100);
    const netWpm = Math.round(grossWpm * (Math.max(accuracy, 0) / 100));
    return { wpm: typed.length === 0 ? 0 : Math.max(netWpm, 0), accuracy: Math.max(0, Math.min(accuracy, 100)) };
  }

  function renderStats() {
    const stats = calculateStats();
    scoreOutput.textContent = String(stats.wpm);
    accuracyOutput.textContent = `${stats.accuracy}%`;
  }

  function resetTest() {
    hideResultModal();
    if (timer) timer.stop();
    elapsed = 0;
    input.disabled = false;
    input.value = "";
    textOutput.textContent = pickText();
    timeOutput.textContent = durationInput.value;
    scoreOutput.textContent = "0";
    accuracyOutput.textContent = "100%";
    timer = createCountdown(Number(durationInput.value), (shown, _r, passed) => {
      elapsed = passed;
      timeOutput.textContent = String(shown);
      renderStats();
    }, (total) => {
      elapsed = total;
      timeOutput.textContent = "0";
      renderStats();
      input.disabled = true;
      const stats = calculateStats();
      showResultModal({
        title: "WPM Result",
        value: `${stats.wpm} WPM`,
        detail: `${stats.accuracy}% accuracy in ${total} seconds`,
        onRetest: resetTest,
        leaderboard: {
          game: "wpm",
          score: stats.wpm,
          secondaryScore: stats.accuracy,
          display: `${stats.wpm} WPM`,
          detail: `${stats.accuracy}% accuracy`,
          variant: leaderboardVariant,
          refresh: refreshLeaderboard
        }
      });
    });
  }

  input.addEventListener("input", () => {
    if (timer && !timer.isRunning()) timer.start();
    renderStats();
  });

  durationInput.addEventListener("change", () => {
    resetTest();
    refreshLeaderboard();
  });
  resetButton.addEventListener("click", resetTest);
  resetTest();
}
function setupSpacebar() {
  const button = document.getElementById("space-button");
  if (!button) return;
  const durationInput = document.getElementById("space-duration");
  const timeOutput = document.getElementById("space-time");
  const countOutput = document.getElementById("space-count");
  const rateOutput = document.getElementById("space-rate");
  const resetButton = document.getElementById("space-reset");
  const leaderboardVariant = () => `${durationInput.value}s`;
  const leaderboardTitle = () => `Top Spacebar Rates (${durationInput.value}s)`;
  const refreshLeaderboard = setupLeaderboard("spacebar", leaderboardTitle, (entry) => entry.display || `${entry.score.toFixed(2)} / sec`, leaderboardVariant);
  let presses = 0;
  let armed = false;
  let finished = false;
  let elapsed = 0;
  let timer = null;

  function liveRate() {
    if (presses === 0) return 0;
    return presses / Math.max(elapsed, 1);
  }

  function resetTest() {
    hideResultModal();
    if (timer) timer.stop();
    presses = 0;
    armed = false;
    finished = false;
    elapsed = 0;
    timeOutput.textContent = durationInput.value;
    countOutput.textContent = "0";
    rateOutput.textContent = "0.00";
    button.textContent = "click here, then press space";
    timer = createCountdown(Number(durationInput.value), (shown, _r, passed) => {
      elapsed = passed;
      timeOutput.textContent = String(shown);
      rateOutput.textContent = liveRate().toFixed(2);
    }, (total) => {
      elapsed = total;
      finished = true;
      armed = false;
      const finalRate = Number((presses / total).toFixed(2));
      timeOutput.textContent = "0";
      rateOutput.textContent = finalRate.toFixed(2);
      button.textContent = "done - click again";
      showResultModal({
        title: "Spacebar Result",
        value: `${finalRate.toFixed(2)} / sec`,
        detail: `${presses} presses in ${total} seconds`,
        onRetest: resetTest,
        leaderboard: {
          game: "spacebar",
          score: finalRate,
          display: `${finalRate.toFixed(2)} / sec`,
          detail: `${presses} presses in ${total}s`,
          variant: leaderboardVariant,
          refresh: refreshLeaderboard
        }
      });
    });
  }

  button.addEventListener("click", () => {
    if (!timer.isRunning()) {
      armed = true;
      finished = false;
      button.focus();
      button.textContent = "ready - now press space";
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.code !== "Space") return;
    if (document.activeElement && ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
    if (!armed && !timer.isRunning()) return;
    event.preventDefault();
    if (!timer.isRunning() && !finished) {
      timer.start();
      button.textContent = "press space fast";
    }
    if (!timer.isRunning()) return;
    presses += 1;
    countOutput.textContent = String(presses);
    rateOutput.textContent = liveRate().toFixed(2);
  });

  durationInput.addEventListener("change", () => {
    resetTest();
    refreshLeaderboard();
  });
  resetButton.addEventListener("click", resetTest);
  resetTest();
}
function setupReaction() {
  const box = document.getElementById("reaction-box");
  if (!box) return;
  const bestOutput = document.getElementById("reaction-best");
  const lastOutput = document.getElementById("reaction-last");
  const refreshLeaderboard = setupLeaderboard("reaction", "Top Reaction Times", (entry) => entry.display || `${Math.abs(entry.score)} ms`, "default", "asc");
  let waiting = false;
  let ready = false;
  let startAt = 0;
  let timeout = null;
  let best = null;

  function idle(text) {
    box.className = "reaction-arena";
    box.textContent = text;
    waiting = false;
    ready = false;
  }

  box.addEventListener("click", () => {
    if (ready) {
      const result = Date.now() - startAt;
      lastOutput.textContent = `${result} ms`;
      if (best === null || result < best) {
        best = result;
        bestOutput.textContent = `${result} ms`;
      }
      showResultModal({
        title: "Reaction Result",
        value: `${result} ms`,
        detail: best === result ? "New best reaction on this device" : `Best on this device: ${best} ms`,
        onRetest: () => idle("click to try again"),
        leaderboard: {
          game: "reaction",
          score: result,
          display: `${result} ms`,
          detail: "Lower is better",
          sort: "asc",
          refresh: refreshLeaderboard
        }
      });
      idle("click to try again");
      return;
    }
    if (waiting) {
      clearTimeout(timeout);
      idle("too early - restart");
      return;
    }
    hideResultModal();
    waiting = true;
    box.className = "reaction-arena waiting";
    box.textContent = "wait for green...";
    timeout = setTimeout(() => {
      waiting = false;
      ready = true;
      startAt = Date.now();
      box.className = "reaction-arena ready";
      box.textContent = "click now";
    }, 1200 + Math.random() * 2200);
  });
}

function buildPips(value) {
  const positions = { 1:[5], 2:[1,9], 3:[1,5,9], 4:[1,3,7,9], 5:[1,3,5,7,9], 6:[1,3,4,6,7,9] };
  if (!positions[value]) return '<div class="pip-number">' + value + '</div>';
  let html = "";
  for (let i = 1; i <= 9; i += 1) {
    html += positions[value].includes(i) ? '<span class="pip"></span>' : '<span></span>';
  }
  return html;
}

function setupDice() {
  const rollButton = document.getElementById("dice-roll");
  if (!rollButton) return;
  const minInput = document.getElementById("dice-min");
  const maxInput = document.getElementById("dice-max");
  const resultOutput = document.getElementById("dice-result");
  const cube = document.getElementById("dice-cube");
  const faceIds = ["dice-face-front","dice-face-back","dice-face-right","dice-face-left","dice-face-top","dice-face-bottom"];

  function paintFaces(value) {
    faceIds.forEach((id) => {
      const face = document.getElementById(id);
      if (face) face.innerHTML = buildPips(value);
    });
  }

  paintFaces(1);

  rollButton.addEventListener("click", () => {
    const min = Number(minInput.value);
    const max = Number(maxInput.value);
    if (!Number.isInteger(min) || !Number.isInteger(max) || min >= max) {
      resultOutput.textContent = "fix range";
      return;
    }
    const value = Math.floor(Math.random() * (max - min + 1)) + min;
    resultOutput.textContent = String(value);
    paintFaces(value);
    const xTurns = -18 - (Math.floor(Math.random() * 4) + 2) * 90;
    const yTurns = 22 + (Math.floor(Math.random() * 4) + 3) * 90;
    cube.style.setProperty("--dice-x", `${xTurns}deg`);
    cube.style.setProperty("--dice-y", `${yTurns}deg`);
    cube.classList.remove("rolling");
    void cube.offsetWidth;
    cube.classList.add("rolling");
  });
}

function setupCoin() {
  const flipButton = document.getElementById("coin-flip");
  if (!flipButton) return;
  const coin = document.getElementById("coin-3d");
  const resultOutput = document.getElementById("coin-result");
  flipButton.addEventListener("click", () => {
    const isHeads = Math.random() < 0.5;
    const endRotation = isHeads ? 1440 : 1620;
    coin.style.setProperty("--coin-rotation", `${endRotation}deg`);
    coin.classList.remove("flipping");
    void coin.offsetWidth;
    coin.classList.add("flipping");
    setTimeout(() => {
      resultOutput.textContent = isHeads ? "heads" : "tails";
    }, 950);
  });
}

function setupSnake() {
  const canvas = document.getElementById("snake-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const scoreNode = document.getElementById("snake-score");
  const bestNode = document.getElementById("snake-best");
  const messageNode = document.getElementById("snake-message");
  const startButton = document.getElementById("snake-start");
  const refreshLeaderboard = setupLeaderboard("snake", "Top Snake Scores", (entry) => entry.display || `${entry.score}`);
  const cell = 21;
  const size = 20;
  let snake = [];
  let food = null;
  let direction = "right";
  let nextDirection = "right";
  let score = 0;
  let best = Number(localStorage.getItem("tech_premi_snake_best") || 0);
  let loop = null;
  let running = false;

  bestNode.textContent = String(best);

  function randomFood() {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
    } while (snake.some((part) => part.x === pos.x && part.y === pos.y));
    return pos;
  }

  function resetGame() {
    snake = [
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 }
    ];
    direction = "right";
    nextDirection = "right";
    score = 0;
    scoreNode.textContent = "0";
    messageNode.textContent = "eat the stars and do not hit the wall";
    food = randomFood();
    drawSnake();
  }

  function drawRoundedRect(x, y, w, h, r, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  function drawSnake() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff8ef";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        ctx.fillStyle = (x + y) % 2 === 0 ? "#f4eadc" : "#fffdf7";
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    snake.forEach((part, index) => {
      drawRoundedRect(part.x * cell + 2, part.y * cell + 2, cell - 4, cell - 4, 6, index === 0 ? "#264653" : "#2a9d8f");
    });

    if (food) {
      ctx.fillStyle = "#ffb703";
      ctx.beginPath();
      ctx.arc(food.x * cell + cell / 2, food.y * cell + cell / 2, cell / 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function finishSnake() {
    running = false;
    clearInterval(loop);
    if (score > best) {
      best = score;
      localStorage.setItem("tech_premi_snake_best", String(best));
      bestNode.textContent = String(best);
    }
    showResultModal({
      title: "Snake Result",
      value: `${score}`,
      detail: "Keep growing without hitting walls or yourself.",
      onRetest: () => startButton.click(),
      leaderboard: {
        game: "snake",
        score,
        display: `${score}`,
        detail: "Snake run",
        refresh: refreshLeaderboard
      }
    });
  }

  function step() {
    if (!running) return;
    direction = nextDirection;
    const head = { ...snake[0] };
    if (direction === "right") head.x += 1;
    if (direction === "left") head.x -= 1;
    if (direction === "up") head.y -= 1;
    if (direction === "down") head.y += 1;

    const hitWall = head.x < 0 || head.y < 0 || head.x >= size || head.y >= size;
    const hitSelf = snake.some((part) => part.x === head.x && part.y === head.y);
    if (hitWall || hitSelf) {
      messageNode.textContent = hitWall ? "wall crash" : "snake crash";
      finishSnake();
      return;
    }

    snake.unshift(head);
    if (food && head.x === food.x && head.y === food.y) {
      score += 1;
      scoreNode.textContent = String(score);
      messageNode.textContent = "nice grab";
      food = randomFood();
    } else {
      snake.pop();
    }

    drawSnake();
  }

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "arrowup" || key === "w") {
      if (direction !== "down") nextDirection = "up";
    }
    if (key === "arrowdown" || key === "s") {
      if (direction !== "up") nextDirection = "down";
    }
    if (key === "arrowleft" || key === "a") {
      if (direction !== "right") nextDirection = "left";
    }
    if (key === "arrowright" || key === "d") {
      if (direction !== "left") nextDirection = "right";
    }
  });

  startButton.addEventListener("click", () => {
    clearInterval(loop);
    running = true;
    hideResultModal();
    resetGame();
    loop = setInterval(step, 130);
  });

  drawSnake();
}

setupCps();
setupWpm();
setupSpacebar();
setupReaction();
setupDice();
setupCoin();
setupSnake();
setupDino();

function setupPhoneMaker() {
  const maker = document.getElementById("phone-card");
  if (!maker) return;

  const controls = {
    name: document.getElementById("phone-name"),
    price: document.getElementById("phone-price"),
    backColor: document.getElementById("phone-back-color"),
    frontColor: document.getElementById("phone-front-color"),
    frameStyle: document.getElementById("phone-frame-style"),
    size: document.getElementById("phone-size"),
    shape: document.getElementById("phone-shape"),
    finish: document.getElementById("phone-finish"),
    wallpaper: document.getElementById("phone-wallpaper"),
    storage: document.getElementById("phone-storage"),
    ram: document.getElementById("phone-ram"),
    battery: document.getElementById("phone-battery"),
    chip: document.getElementById("phone-chip"),
    cameraCount: document.getElementById("phone-camera-count"),
    cameraSize: document.getElementById("phone-camera-size"),
    cameraShape: document.getElementById("phone-camera-shape"),
    cameraStyle: document.getElementById("phone-camera-style"),
    cameraLayout: document.getElementById("phone-camera-layout"),
    frontCamera: document.getElementById("phone-front-camera")
  };

  const countValue = document.getElementById("camera-count-value");
  const sizeValue = document.getElementById("camera-size-value");
  const previewName = document.getElementById("preview-phone-name");
  const previewPrice = document.getElementById("preview-phone-price");
  const previewRating = document.getElementById("preview-rating");
  const specStrip = document.getElementById("spec-strip");
  const back = document.getElementById("phone-back");
  const front = document.getElementById("phone-front");
  const surface = document.getElementById("camera-surface");
  const screenUi = document.getElementById("screen-ui");
  const screenNotch = document.getElementById("screen-notch");
  const presetButtons = document.querySelectorAll(".preset-chip");
  const viewButtons = document.querySelectorAll(".view-mode-chip");
  const viewer = document.getElementById("phone-viewer");

  const state = {
    view: "split",
    rotationX: -14,
    rotationY: -26,
    hasDraggedPhone: false,
    draggingPhone: false,
    draggingLensId: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    cameraPositions: []
  };

  const presets = {
    classic: {
      backColor: "#5b7eff", frontColor: "#121212",
      frameStyle: "rounded", size: "medium", shape: "soft", finish: "gloss", wallpaper: "space",
      storage: "256", ram: "12", battery: "5000", chip: "fast", cameraCount: 3, cameraSize: 26,
      cameraShape: "circle", cameraStyle: "classic", cameraLayout: "grid", frontCamera: "punch", price: 699
    },
    gaming: {
      backColor: "#222650", frontColor: "#0b0b10",
      frameStyle: "chunky", size: "ultra", shape: "boxy", finish: "carbon", wallpaper: "gaming",
      storage: "512", ram: "16", battery: "6000", chip: "ultra", cameraCount: 4, cameraSize: 30,
      cameraShape: "square", cameraStyle: "pro", cameraLayout: "stack", frontCamera: "pill", price: 999
    },
    luxury: {
      backColor: "#6f675f", frontColor: "#131313",
      frameStyle: "metal", size: "large", shape: "round", finish: "gloss", wallpaper: "minimal",
      storage: "512", ram: "12", battery: "5000", chip: "pro", cameraCount: 3, cameraSize: 32,
      cameraShape: "circle", cameraStyle: "ring", cameraLayout: "triangle", frontCamera: "punch", price: 1199
    },
    camera: {
      backColor: "#6b756f", frontColor: "#101010",
      frameStyle: "metal", size: "ultra", shape: "soft", finish: "frost", wallpaper: "sunrise",
      storage: "1024", ram: "16", battery: "5500", chip: "pro", cameraCount: 5, cameraSize: 34,
      cameraShape: "circle", cameraStyle: "pro", cameraLayout: "grid", frontCamera: "under", price: 1499
    }
  };

  function sizeConfig(value) {
    if (value === "small") return { width: 156, height: 302 };
    if (value === "large") return { width: 196, height: 372 };
    if (value === "ultra") return { width: 212, height: 396 };
    return { width: 180, height: 340 };
  }

  function radiusConfig(value) {
    if (value === "round") return "54px";
    if (value === "boxy") return "26px";
    if (value === "pill") return "72px";
    return "42px";
  }

  function frameConfig(value) {
    if (value === "flat") {
      return {
        borderWidth: "7px",
        backBorderColor: "#b8bec8",
        frontBorderColor: "#171a20",


        sideTone: "linear-gradient(180deg, #c8ced7 0%, #8f98a4 100%)",
        shadow: "inset 0 1px 0 rgba(255,255,255,0.52), 0 24px 34px rgba(0,0,0,0.2)"
      };
    }
    if (value === "metal") {
      return {
        borderWidth: "9px",
        backBorderColor: "#b39e8a",
        frontBorderColor: "#111317",


        sideTone: "linear-gradient(180deg, #ccb59b 0%, #8d7864 100%)",
        shadow: "inset 0 1px 0 rgba(255,255,255,0.48), 0 26px 38px rgba(0,0,0,0.24)"
      };
    }
    if (value === "chunky") {
      return {
        borderWidth: "13px",
        backBorderColor: "#3a4048",
        frontBorderColor: "#090b0f",


        sideTone: "linear-gradient(180deg, #555d68 0%, #20252c 100%)",
        shadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 28px 40px rgba(0,0,0,0.3)"
      };
    }
    return {
      borderWidth: "8px",
      backBorderColor: "#c8ced6",
      frontBorderColor: "#12151b",


      sideTone: "linear-gradient(180deg, #d2d9e1 0%, #919aa5 100%)",
      shadow: "inset 0 1px 0 rgba(255,255,255,0.58), 0 24px 34px rgba(0,0,0,0.22)"
    };
  }

  function gradientFromColor(hex, darken) {
    const value = hex.replace("#", "");
    const r = parseInt(value.substring(0, 2), 16);
    const g = parseInt(value.substring(2, 4), 16);
    const b = parseInt(value.substring(4, 6), 16);
    const dr = Math.max(0, r - darken);
    const dg = Math.max(0, g - darken);
    const db = Math.max(0, b - darken);
    return `linear-gradient(180deg, ${hex} 0%, rgb(${dr}, ${dg}, ${db}) 100%)`;
  }

  function mixColor(hex, amount) {
    const value = hex.replace("#", "");
    const r = parseInt(value.substring(0, 2), 16);
    const g = parseInt(value.substring(2, 4), 16);
    const b = parseInt(value.substring(4, 6), 16);
    const nr = clamp(Math.round(r + amount), 0, 255);
    const ng = clamp(Math.round(g + amount), 0, 255);
    const nb = clamp(Math.round(b + amount), 0, 255);
    return `rgb(${nr}, ${ng}, ${nb})`;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function wrapRotation(value) {
    return ((value % 360) + 360) % 360;
  }

  function setPreset(name) {
    const preset = presets[name];
    if (!preset) return;
    Object.entries(preset).forEach(([key, value]) => {
      const control = controls[key];
      if (control) control.value = value;
    });
    state.cameraPositions = [];
    renderPhone();
  }

  function getLayoutPositions(count, layout) {
    const layouts = {
      grid: [
        { x: 0.22, y: 0.16 }, { x: 0.54, y: 0.16 }, { x: 0.22, y: 0.45 },
        { x: 0.54, y: 0.45 }, { x: 0.22, y: 0.73 }, { x: 0.54, y: 0.73 }
      ],
      triangle: [
        { x: 0.38, y: 0.12 }, { x: 0.16, y: 0.46 }, { x: 0.6, y: 0.46 },
        { x: 0.16, y: 0.76 }, { x: 0.6, y: 0.76 }, { x: 0.38, y: 0.62 }
      ],
      stack: [
        { x: 0.38, y: 0.1 }, { x: 0.38, y: 0.28 }, { x: 0.38, y: 0.46 },
        { x: 0.38, y: 0.64 }, { x: 0.38, y: 0.82 }, { x: 0.38, y: 0.54 }
      ],
      strip: [
        { x: 0.06, y: 0.22 }, { x: 0.36, y: 0.22 }, { x: 0.66, y: 0.22 },
        { x: 0.06, y: 0.56 }, { x: 0.36, y: 0.56 }, { x: 0.66, y: 0.56 }
      ]
    };
    return (layouts[layout] || layouts.grid).slice(0, count).map((position) => ({ ...position }));
  }

  function ensureCameraPositions() {
    const count = Number(controls.cameraCount.value);
    const layout = controls.cameraLayout.value;
    const defaults = getLayoutPositions(count, layout);
    state.cameraPositions = Array.from({ length: count }, (_, index) => {
      const saved = state.cameraPositions[index];
      return saved ? { x: saved.x, y: saved.y } : defaults[index];
    });
  }

  function setView(view) {
    state.view = view;
    maker.className = `phone-card ${view}-view`;
    viewButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.view === view);
    });
    if (view === "three" && !state.hasDraggedPhone) {
      state.rotationX = -16;
      state.rotationY = -28;
    }
    apply3DTransform();
  }

  function apply3DTransform() {
    maker.style.setProperty("--phone-rotate-x", `${state.rotationX}deg`);
    maker.style.setProperty("--phone-rotate-y", `${state.rotationY}deg`);
  }

  function renderCameras() {
    const count = Number(controls.cameraCount.value);
    const lensSize = Number(controls.cameraSize.value);
    const shape = controls.cameraShape.value;
    const style = controls.cameraStyle.value;
    countValue.textContent = String(count);
    sizeValue.textContent = String(lensSize);
    ensureCameraPositions();

    surface.innerHTML = "";

    state.cameraPositions.forEach((position, index) => {
      const lens = document.createElement("button");
      lens.type = "button";
      lens.className = `camera-lens draggable-lens ${shape} ${style}`;
      lens.dataset.index = String(index);
      lens.setAttribute("aria-label", `Camera lens ${index + 1}`);
      lens.style.width = `${lensSize}px`;
      lens.style.height = `${lensSize}px`;
      lens.style.left = `${position.x * 100}%`;
      lens.style.top = `${position.y * 100}%`;
      surface.appendChild(lens);
    });
  }

  function renderSpecs() {
    specStrip.innerHTML = `
      <div class="spec-pill"><span>Storage</span><strong>${controls.storage.value} GB</strong></div>
      <div class="spec-pill"><span>RAM</span><strong>${controls.ram.value} GB</strong></div>
      <div class="spec-pill"><span>Battery</span><strong>${controls.battery.value} mAh</strong></div>
      <div class="spec-pill"><span>Chip</span><strong>${controls.chip.value}</strong></div>
    `;

    const chipMap = {
      daily: "Daily phone",
      fast: "Fast flagship",
      pro: "Pro creator",
      ultra: "Ultra gaming beast"
    };
    previewRating.textContent = chipMap[controls.chip.value] || "Custom build";
  }

  function renderFrontCamera() {
    screenNotch.className = `screen-notch front-${controls.frontCamera.value}`;
  }

  function renderWallpaper() {
    screenUi.className = `screen-ui wallpaper-${controls.wallpaper.value}`;
  }

  function renderFinish() {
    back.classList.remove("glossy", "matte", "frost", "carbon");
    front.classList.remove("glossy", "matte", "frost", "carbon");

    const finish = controls.finish.value;
    if (finish === "gloss") {
      back.classList.add("glossy");
      front.classList.add("glossy");
    }
    if (finish === "matte") {
      back.classList.add("matte");
      front.classList.add("matte");
    }
    if (finish === "frost") {
      back.classList.add("frost");
      front.classList.add("frost");
    }
    if (finish === "carbon") {
      back.classList.add("carbon");
    }
  }

  function renderPhone() {
    previewName.textContent = controls.name.value || "My Phone";
    previewPrice.textContent = `$${Number(controls.price.value || 0)}`;

    const backTop = mixColor(controls.backColor.value, 18);
    const backBase = mixColor(controls.backColor.value, -42);
    const frontTop = mixColor(controls.frontColor.value, 6);
    const frontBase = mixColor(controls.frontColor.value, -10);

    back.style.background = `linear-gradient(160deg, ${backTop} 0%, ${controls.backColor.value} 42%, ${backBase} 100%)`;
    front.style.background = `linear-gradient(180deg, ${frontTop} 0%, ${controls.frontColor.value} 35%, ${frontBase} 100%)`;

    const frame = frameConfig(controls.frameStyle.value);
    const size = sizeConfig(controls.size.value);
    const radius = radiusConfig(controls.shape.value);
    const depth = controls.frameStyle.value === "chunky" ? 30 : controls.frameStyle.value === "metal" ? 24 : controls.frameStyle.value === "flat" ? 18 : 22;

    maker.style.setProperty("--device-width", `${size.width}px`);
    maker.style.setProperty("--device-height", `${size.height}px`);
    maker.style.setProperty("--device-depth", `${depth}px`);
    maker.style.setProperty("--device-radius", radius);
    maker.style.setProperty("--device-side-tone", frame.sideTone);
    maker.style.setProperty("--device-accent", mixColor(controls.backColor.value, 56));
    maker.style.setProperty("--device-shadow", mixColor(controls.backColor.value, -84));
    maker.style.setProperty("--screen-tint", mixColor(controls.backColor.value, 18));

    back.style.width = `${size.width}px`;
    back.style.height = `${size.height}px`;
    back.style.borderColor = frame.backBorderColor;
    back.style.borderWidth = frame.borderWidth;
    back.style.borderRadius = radius;
    back.style.boxShadow = frame.shadow;
    back.style.backgroundOrigin = "padding-box";
    back.style.borderImage = "none";

    front.style.width = `${size.width}px`;
    front.style.height = `${size.height}px`;
    front.style.borderColor = frame.frontBorderColor;
    front.style.borderWidth = frame.borderWidth;
    front.style.borderRadius = radius;
    front.style.boxShadow = frame.shadow;
    front.style.backgroundOrigin = "padding-box";
    front.style.borderImage = "none";

    back.style.setProperty("--phone-back-highlight", mixColor(controls.backColor.value, 45));
    back.style.setProperty("--phone-back-shadow", mixColor(controls.backColor.value, -70));
    surface.style.borderRadius = `calc(${radius} - 12px)`;
    renderCameras();
    renderSpecs();
    renderFrontCamera();
    renderWallpaper();
    renderFinish();
    apply3DTransform();
  }

  function startLensDrag(target, clientX, clientY) {
    const lensRect = target.getBoundingClientRect();
    state.draggingLensId = Number(target.dataset.index);
    state.dragOffsetX = clientX - lensRect.left;
    state.dragOffsetY = clientY - lensRect.top;
    viewer.classList.add("dragging-lens");
  }

  function updateLensPosition(clientX, clientY) {
    if (state.draggingLensId === null) return;
    const lensSize = Number(controls.cameraSize.value);
    const rect = surface.getBoundingClientRect();
    const usableX = rect.width - lensSize;
    const usableY = rect.height - lensSize;
    const rawX = clientX - rect.left - state.dragOffsetX;
    const rawY = clientY - rect.top - state.dragOffsetY;
    const x = usableX <= 0 ? 0 : clamp(rawX / usableX, 0, 1);
    const y = usableY <= 0 ? 0 : clamp(rawY / usableY, 0, 1);
    state.cameraPositions[state.draggingLensId] = { x, y };
    renderCameras();
  }

  function stopLensDrag() {
    state.draggingLensId = null;
    viewer.classList.remove("dragging-lens");
  }

  function startPhoneDrag(clientX, clientY) {
    if (state.view !== "three") return;
    state.draggingPhone = { x: clientX, y: clientY, startX: state.rotationX, startY: state.rotationY };
    viewer.classList.add("dragging-phone");
  }

  function updatePhoneDrag(clientX, clientY) {
    if (!state.draggingPhone) return;
    const deltaX = clientX - state.draggingPhone.x;
    const deltaY = clientY - state.draggingPhone.y;
    state.rotationY = wrapRotation(state.draggingPhone.startY + deltaX * 0.35);
    state.rotationX = clamp(state.draggingPhone.startX - deltaY * 0.28, -78, 78);
    state.hasDraggedPhone = true;
    apply3DTransform();
  }

  function stopPhoneDrag() {
    state.draggingPhone = false;
    viewer.classList.remove("dragging-phone");
  }

  surface.addEventListener("pointerdown", (event) => {
    const lens = event.target.closest(".draggable-lens");
    if (!lens) return;
    event.preventDefault();
    if (surface.setPointerCapture) {
      surface.setPointerCapture(event.pointerId);
    }
    startLensDrag(lens, event.clientX, event.clientY);
  });

  viewer.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".draggable-lens") || !event.target.closest(".phone-card")) return;
    if (viewer.setPointerCapture) {
      viewer.setPointerCapture(event.pointerId);
    }
    startPhoneDrag(event.clientX, event.clientY);
  });

  window.addEventListener("pointermove", (event) => {
    updateLensPosition(event.clientX, event.clientY);
    updatePhoneDrag(event.clientX, event.clientY);
  });

  window.addEventListener("pointerup", () => {
    stopLensDrag();
    stopPhoneDrag();
  });

  window.addEventListener("pointercancel", () => {
    stopLensDrag();
    stopPhoneDrag();
  });

  Object.values(controls).forEach((control) => {
    if (control) {
      control.addEventListener("input", () => {
        if (control === controls.cameraCount || control === controls.cameraLayout) {
          state.cameraPositions = [];
        }
        renderPhone();
      });
    }
  });

  presetButtons.forEach((button) => {
    button.addEventListener("click", () => setPreset(button.dataset.preset));
  });

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  const mobileToggle = document.getElementById("maker-mobile-toggle");
  const makerLayout = document.getElementById("maker-layout");
  if (mobileToggle && makerLayout) {
    mobileToggle.addEventListener("click", () => {
      makerLayout.classList.toggle("controls-open");
      mobileToggle.textContent = makerLayout.classList.contains("controls-open") ? "Hide controls" : "Show controls";
    });
  }

  setView("split");
  renderPhone();
}

setupPhoneMaker();
setupUsernameGenerator();
setupMarioPlatformer();













































function setupUsernameGenerator() {
  const card = document.getElementById("username-card");
  if (!card) return;

  const keywordInput = document.getElementById("username-keyword");
  const styleSelect = document.getElementById("username-style");
  const formatSelect = document.getElementById("username-format");
  const countSelect = document.getElementById("username-count");
  const maxLengthInput = document.getElementById("username-max-length");
  const numbersToggle = document.getElementById("username-numbers");
  const underscoreToggle = document.getElementById("username-underscore");
  const generateButton = document.getElementById("username-generate");
  const localButton = document.getElementById("username-generate-local");
  const status = document.getElementById("username-status");
  const results = document.getElementById("username-results");

  const styleBanks = {
    cool: {
      prefixes: ["neo", "hyper", "shadow", "void", "astro", "frost", "drift", "nova"],
      suffixes: ["x", "zone", "pulse", "shift", "blade", "core", "storm", "drive"]
    },
    clean: {
      prefixes: ["the", "real", "its", "just", "hello", "prime", "daily", "mono"],
      suffixes: ["hub", "works", "space", "flow", "room", "craft", "line", "lab"]
    },
    cute: {
      prefixes: ["luna", "mimi", "peach", "bunny", "mochi", "star", "berry", "daisy"],
      suffixes: ["pop", "bun", "kiss", "sprout", "puff", "dream", "cake", "bee"]
    },
    pro: {
      prefixes: ["official", "pixel", "design", "studio", "alpha", "vision", "prime", "vector"],
      suffixes: ["media", "yt", "hq", "live", "builds", "ops", "labs", "tv"]
    },
    chaotic: {
      prefixes: ["glitch", "goblin", "crash", "spam", "turbo", "chaos", "nuke", "zero"],
      suffixes: ["404", "exe", "rage", "lol", "mode", "arc", "byte", "warp"]
    }
  };

  const tagSuffixes = ["xd", "x", "tv", "fps", "lol", "v2", "alt", "arc", "byte", "-="];

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 18);
  }

  function getCount() {
    const count = Math.max(1, Math.min(16, Number(countSelect.value || 12)));
    countSelect.value = String(count);
    return count;
  }

  function getMaxLength() {
    const maxLength = Math.max(4, Math.min(24, Number(maxLengthInput.value || 16)));
    maxLengthInput.value = String(maxLength);
    return maxLength;
  }

  function randomFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function randomNumber() {
    return String(Math.floor(10 + Math.random() * 989));
  }

  function cleanUsername(value) {
    let username = String(value || "").toLowerCase().replace(/[^a-z0-9_\-=]/g, "");
    if (!numbersToggle.checked) username = username.replace(/[0-9]+/g, "");
    if (!underscoreToggle.checked) username = username.replace(/_/g, "");
    return username;
  }

  function maybeJoin(parts) {
    if (underscoreToggle.checked && Math.random() < 0.35) return parts.join("_");
    return parts.join("");
  }

  function chooseFitting(list, maxLength, fallback) {
    const cleaned = list
      .map((item) => cleanUsername(item))
      .filter((item) => item.length >= 4 && item.length <= maxLength);
    if (cleaned.length) return randomFrom(cleaned);
    return cleanUsername(fallback || "nova").slice(0, maxLength);
  }

  function buildLocalUsername() {
    const style = styleBanks[styleSelect.value] || styleBanks.cool;
    const format = formatSelect.value || "mixed";
    const base = slugify(keywordInput.value);
    const maxLength = getMaxLength();
    const endings = numbersToggle.checked ? ["", randomNumber()] : [""];
    const pieces = [];

    if (format === "oneword") {
      pieces.push(base);
      style.prefixes.forEach((prefix) => {
        pieces.push(prefix);
        pieces.push(`${prefix}${base}`);
        pieces.push(`${base}${prefix}`);
      });
      style.suffixes.forEach((suffix) => {
        pieces.push(suffix);
        pieces.push(`${base}${suffix}`);
        pieces.push(`${suffix}${base}`);
      });
      return chooseFitting(pieces, maxLength, base || randomFrom(style.prefixes));
    }

    if (format === "tag") {
      const leftOptions = [base, ...style.prefixes, ...style.suffixes].filter(Boolean);
      leftOptions.forEach((left) => {
        tagSuffixes.forEach((suffix) => {
          endings.forEach((ending) => {
            pieces.push(`${left}${suffix}${ending}`);
            pieces.push(`${left}_${suffix}${ending}`);
            pieces.push(`${left}-=${ending || randomNumber()}`);
          });
        });
      });
      return chooseFitting(pieces, maxLength, `${base || 'nova'}xd`);
    }

    const firstOptions = [base, ...style.prefixes].filter(Boolean);
    const secondOptions = [base, ...style.suffixes].filter(Boolean);
    firstOptions.forEach((first) => {
      secondOptions.forEach((second) => {
        endings.forEach((ending) => {
          pieces.push(maybeJoin([first, second]) + ending);
          pieces.push(maybeJoin([second, first]) + ending);
        });
      });
    });
    style.prefixes.forEach((prefix) => {
      style.suffixes.forEach((suffix) => {
        endings.forEach((ending) => {
          pieces.push(maybeJoin([prefix, suffix]) + ending);
          pieces.push(`${prefix}${randomFrom(tagSuffixes)}${ending}`);
        });
      });
    });

    return chooseFitting(pieces, maxLength, base || randomFrom(style.prefixes));
  }

  function renderUsernames(items) {
    results.innerHTML = items.map((name) => `
      <button class="username-chip" type="button" data-name="${name}">
        <span>${name}</span>
        <strong>copy</strong>
      </button>
    `).join("");
  }

  function generateLocalSet() {
    const count = getCount();
    const seen = new Set();
    const items = [];

    while (items.length < count) {
      const candidate = buildLocalUsername();
      if (!candidate || candidate.length < 4 || seen.has(candidate)) continue;
      seen.add(candidate);
      items.push(candidate);
    }

    renderUsernames(items);
    return items;
  }

  function getSavedOpenAiKey() {
    try {
      return localStorage.getItem("username-generator-openai-key") || "";
    } catch (_error) {
      return "";
    }
  }

  function saveOpenAiKey(value) {
    try {
      if (value) localStorage.setItem("username-generator-openai-key", value);
      else localStorage.removeItem("username-generator-openai-key");
    } catch (_error) {}
  }

  function promptForOpenAiKey() {
    const current = getSavedOpenAiKey();
    const entered = window.prompt("Paste your OpenAI API key to enable AI usernames on this device.", current);
    if (entered === null) return "";
    const trimmed = entered.trim();
    saveOpenAiKey(trimmed);
    return trimmed;
  }

  async function generateWithAi() {
    const count = getCount();
    const maxLength = getMaxLength();
    status.textContent = "Generating AI usernames...";
    generateButton.disabled = true;
    localButton.disabled = true;

    try {
      let apiKey = getSavedOpenAiKey();
      const response = await fetch("/api/generate-usernames", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-openai-api-key": apiKey } : {})
        },
        body: JSON.stringify({
          keyword: keywordInput.value,
          style: styleSelect.value,
          format: formatSelect.value,
          count,
          maxLength,
          allowNumbers: numbersToggle.checked,
          allowUnderscore: underscoreToggle.checked
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.error || "AI generation failed.");
        error.code = data.errorCode || "ai_generation_failed";
        error.setupHint = data.setupHint || "";
        throw error;
      }

      const usernames = Array.isArray(data.usernames) ? data.usernames.filter(Boolean) : [];
      if (!usernames.length) throw new Error("AI returned no usernames.");

      renderUsernames(usernames.slice(0, count));
      status.textContent = "AI usernames ready.";
    } catch (error) {
      if (error.code === "missing_openai_api_key") {
        const enteredKey = promptForOpenAiKey();
        if (enteredKey) {
          status.textContent = "API key saved. Click Generate with AI again.";
        } else {
          generateLocalSet();
          status.textContent = "AI needs a key to continue. Paste one when prompted, or use Quick format.";
        }
      } else {
        generateLocalSet();
        status.textContent = `${error.message} Showing quick formatted usernames instead.`;
      }
    } finally {
      generateButton.disabled = false;
      localButton.disabled = false;
    }
  }

  generateButton.addEventListener("click", generateWithAi);
  localButton.addEventListener("click", () => {
    generateLocalSet();
    status.textContent = "Quick formatted usernames ready.";
  });

  results.addEventListener("click", async (event) => {
    const button = event.target.closest(".username-chip");
    if (!button) return;
    const name = button.dataset.name || "";
    try {
      await navigator.clipboard.writeText(name);
      button.classList.add("copied");
      button.querySelector("strong").textContent = "copied";
      setTimeout(() => {
        button.classList.remove("copied");
        button.querySelector("strong").textContent = "copy";
      }, 1200);
    } catch (_error) {
      button.querySelector("strong").textContent = "select";
    }
  });

  [keywordInput, styleSelect, formatSelect, countSelect, maxLengthInput, numbersToggle, underscoreToggle].forEach((node) => {
    node.addEventListener("change", () => {
      status.textContent = "";
    });
    node.addEventListener("input", () => {
      status.textContent = "";
    });
  });

  generateLocalSet();
  status.textContent = getSavedOpenAiKey()
    ? "AI mode is ready on this device."
    : "AI mode is ready. If a key is needed, the page will ask once on this device.";
}







function setupMarioPlatformer() {
  const canvas = document.getElementById("mario-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const scoreNode = document.getElementById("mario-score");
  const bestNode = document.getElementById("mario-best");
  const coinsNode = document.getElementById("mario-coins");
  const livesNode = document.getElementById("mario-lives");
  const messageNode = document.getElementById("mario-message");
  const startButton = document.getElementById("mario-start");
  const jumpButton = document.getElementById("mario-jump");
  const leftButton = document.getElementById("mario-left");
  const rightButton = document.getElementById("mario-right");
  const mapGrid = document.getElementById("mario-map-grid");
  const characterGrid = document.getElementById("mario-character-grid");
  const detailKicker = document.getElementById("mario-detail-kicker");
  const detailTitle = document.getElementById("mario-detail-title");
  const detailLook = document.getElementById("mario-detail-look");
  const detailStory = document.getElementById("mario-detail-story");
  const detailPower = document.getElementById("mario-detail-power");
  const refreshLeaderboard = setupLeaderboard("platform-sprint", "Top Platform Sprint Runs", (entry) => entry.display || `${entry.score}`);
  const bestStorageKey = "tech_premi_platform_sprint_best";
  const mapStorageKey = "tech_premi_platform_sprint_map";
  const characterStorageKey = "tech_premi_platform_sprint_character";

    const maps = [
    { id: "meadow", name: "Meadow Dash", unlock: 0, story: "Sprout first ran here while chasing a stolen wind bell through the soft hills.", look: "Bright grass, soft skies, and warm training trails.", skyTop: "#83d7ff", skyBottom: "#fff3b8", groundTop: "#9be06d", groundBottom: "#72c14f", platform: "#bd7a41", accent: "#d89857", pipe: "#29a85d", enemy: "#9f5b31", gapBoost: 0, enemyBoost: 0, speedBoost: 0 },
    { id: "sunset", name: "Sunset Steps", unlock: 5000, story: "The sky burns orange as runners cross collapsing rooftop paths before dark.", look: "Amber light, warm stone, and longer evening shadows.", skyTop: "#ffb07f", skyBottom: "#ffe3b1", groundTop: "#ffc16d", groundBottom: "#e28743", platform: "#b76b34", accent: "#d8904f", pipe: "#a84f29", enemy: "#7e3f21", gapBoost: 4, enemyBoost: 0.04, speedBoost: 0.12 },
    { id: "frost", name: "Frost Hop", unlock: 10000, story: "A frozen courier trail where every step echoes across quiet blue ice.", look: "Crystal blues, pale snow, and glossy frozen platforms.", skyTop: "#9fe7ff", skyBottom: "#e9fbff", groundTop: "#e4f8ff", groundBottom: "#b9d7ea", platform: "#94b3c6", accent: "#dff6ff", pipe: "#78b8d8", enemy: "#65889d", gapBoost: 6, enemyBoost: 0.06, speedBoost: 0.16 },
    { id: "night", name: "Moon Run", unlock: 15000, story: "Under the moon, only the bravest messengers take the silent ridge road.", look: "Indigo skies, moonlit stone, and cool glowing edges.", skyTop: "#1f2a67", skyBottom: "#4a58a8", groundTop: "#89b86b", groundBottom: "#49683e", platform: "#5b4a8a", accent: "#7f6dc0", pipe: "#394a8f", enemy: "#564576", gapBoost: 8, enemyBoost: 0.08, speedBoost: 0.2 },
    { id: "jungle", name: "Jungle Bounce", unlock: 20000, story: "Vines, roots, and hidden drums push the route into a wild green sprint.", look: "Dense leaves, muddy stone, and humid glowing greens.", skyTop: "#63c483", skyBottom: "#d8ffb4", groundTop: "#78d44f", groundBottom: "#3f8d2d", platform: "#8d5a2b", accent: "#ba8549", pipe: "#2f8d3f", enemy: "#6b431e", gapBoost: 10, enemyBoost: 0.1, speedBoost: 0.24 },
    { id: "lava", name: "Lava Leap", unlock: 25000, story: "Molten vents crack the route open while the floor glows under every landing.", look: "Hot reds, ember stone, and pressure-cooked danger.", skyTop: "#702321", skyBottom: "#ff9d4d", groundTop: "#ffb347", groundBottom: "#c74c1b", platform: "#7a3321", accent: "#c85d2a", pipe: "#8b2c17", enemy: "#5f1e14", gapBoost: 12, enemyBoost: 0.12, speedBoost: 0.28 },
    { id: "candy", name: "Candy Cloud", unlock: 30000, story: "Sugar bridges float above whipped skies, but the sweet path still bites back.", look: "Pink clouds, soft glow, and glossy candy surfaces.", skyTop: "#ffb7d9", skyBottom: "#fff1b5", groundTop: "#ffd7f4", groundBottom: "#ff91bc", platform: "#c86a8f", accent: "#f7a3c2", pipe: "#ff7ec4", enemy: "#a84d76", gapBoost: 14, enemyBoost: 0.14, speedBoost: 0.32 },
    { id: "storm", name: "Storm Circuit", unlock: 35000, story: "A steel sky race where thunder rolls beside every misty platform.", look: "Slate clouds, damp metal tones, and storm-lit terrain.", skyTop: "#4a5a72", skyBottom: "#b7c6d4", groundTop: "#95c2a1", groundBottom: "#4a7d60", platform: "#56606d", accent: "#7e8a98", pipe: "#3d5968", enemy: "#42484f", gapBoost: 16, enemyBoost: 0.16, speedBoost: 0.36 },
    { id: "void", name: "Void Drift", unlock: 40000, story: "The route bends through silent space where distance itself starts to slip.", look: "Deep violet skies, neon edges, and unreal depth.", skyTop: "#160d2f", skyBottom: "#4b2f82", groundTop: "#6ce5ff", groundBottom: "#2f4c83", platform: "#41326d", accent: "#7458c3", pipe: "#3650b8", enemy: "#302652", gapBoost: 18, enemyBoost: 0.18, speedBoost: 0.4 },
    { id: "crown", name: "Crown Summit", unlock: 45000, story: "Only elite runners reach the royal peak where every mistake costs the crown.", look: "Golden light, polished stone, and championship pressure.", skyTop: "#f4c655", skyBottom: "#fff3bf", groundTop: "#f7e28b", groundBottom: "#b88a2e", platform: "#8a5e1f", accent: "#d69b3d", pipe: "#9f7c19", enemy: "#6e4817", gapBoost: 20, enemyBoost: 0.2, speedBoost: 0.45 }
  ];

  const characters = [
    ["sprout", "Sprout", "#d93f31", "#203dbe", "#f5b08d", "#7b3f1d"],
    ["ember", "Ember", "#ff6238", "#4149d5", "#f4b28a", "#64331a"],
    ["sky", "Sky", "#3d84ff", "#0b2f75", "#f7c0a0", "#5a3117"],
    ["mint", "Mint", "#3cc27e", "#1d5b5f", "#f0c09e", "#684222"],
    ["violet", "Violet", "#9e5dff", "#3b2781", "#edb390", "#6a3820"],
    ["gold", "Goldie", "#f4b841", "#8b4c10", "#f6bf95", "#663516"],
    ["ruby", "Ruby", "#d8385a", "#581336", "#efb08f", "#5f2c1a"],
    ["cobalt", "Cobalt", "#2453b8", "#152855", "#f5c3a4", "#56311f"],
    ["moss", "Moss", "#4d9f47", "#30581f", "#eeb996", "#5a381e"],
    ["peach", "Peachy", "#ff9572", "#ad4c31", "#ffd3b3", "#754425"],
    ["nova", "Nova", "#ff5cb8", "#66225b", "#f4bf97", "#5e341e"],
    ["glacier", "Glacier", "#7ee5ff", "#2b6b87", "#f5cfb2", "#654029"],
    ["graphite", "Graphite", "#555c67", "#232933", "#efc09a", "#3d2416"],
    ["copper", "Copper", "#c96b35", "#6d3016", "#f0bc93", "#60341c"],
    ["orchid", "Orchid", "#be63f0", "#4d2272", "#f1bea1", "#694027"],
    ["teal", "Tealy", "#28b7b1", "#165f63", "#eeb690", "#5b351b"],
    ["flare", "Flare", "#ff6a2b", "#6e2010", "#f5bc96", "#6b371b"],
    ["pixel", "Pixel", "#f7f7f7", "#494949", "#eec4a8", "#5f402d"],
    ["midnight", "Midnight", "#251f56", "#0c0b24", "#efc0a2", "#3f271c"],
    ["royal", "Royal", "#ffd44f", "#6b2f91", "#f3c9a8", "#5d341e"]
  ].map((item, index) => {
    const powerKinds = ["size", "speed", "lives", "jumps"];
    const powerType = powerKinds[index % powerKinds.length];
    const level = Math.floor(index / 4);
    const powers = {
      size: {
        title: "Small Frame",
        description: `Hitbox shrinks by ${10 + level * 4}% for tighter dodges.`
      },
      speed: {
        title: "Runner Boost",
        description: `Run speed rises by ${8 + level * 3}% across the route.`
      },
      lives: {
        title: "Second Chance",
        description: `Start with ${2 + level} lives before the run ends.`
      },
      jumps: {
        title: "Air Chain",
        description: `${3 + level} total jumps before landing again.`
      }
    };
    const stories = [
      "A rookie courier who believes every hill hides a shortcut.",
      "A heat-chaser from the forge roads who never slows first.",
      "A rooftop scout who runs by instinct and blue horizon lines.",
      "A forest trickster who turns calm landings into extra height.",
      "A twilight racer who treats silence like fuel.",
      "A treasure hunter chasing the next bright route.",
      "A rival captain who learned sprint timing from street races.",
      "A steel-track prodigy built for clean rhythm.",
      "A mud-road survivor who never panics in rough ground.",
      "A bold drifter with a habit of landing on the edge and smiling.",
      "A neon sprinter from the late-city circuits.",
      "A cold-route courier who makes slippery paths look easy.",
      "A quiet tactician who wins by never wasting a step.",
      "A workshop speedster who trusts raw momentum.",
      "A dream-runner chasing glowing shortcuts through the sky.",
      "A tide runner who keeps balance where others tilt.",
      "A volcanic challenger who treats danger like applause.",
      "A pixel arena champion from the oldest training sims.",
      "A midnight relay ace who thrives when the route gets mean.",
      "A summit legend who runs like the finish line already belongs to them."
    ];
    return {
      id: item[0],
      name: item[1],
      hat: item[2],
      suit: item[3],
      skin: item[4],
      boots: item[5],
      unlock: index * 1000,
      story: stories[index],
      look: `${item[1]} wears a bold ${item[2]} cap, a ${item[3]} suit, and ${item[5]} boots.`,
      power: {
        type: powerType,
        title: powers[powerType].title,
        description: powers[powerType].description
      }
    };
  });

  let best = Number(localStorage.getItem(bestStorageKey) || 0);
  let infoModal = null;
  let selectedMapId = localStorage.getItem(mapStorageKey) || maps[0].id;
  let selectedCharacterId = localStorage.getItem(characterStorageKey) || characters[0].id;

  const state = {
    running: false,
    frame: 0,
    animation: null,
    worldX: 0,
    nextChunkX: 0,
    score: 0,
    coins: 0,
    lives: 1,
    platforms: [],
    coinsList: [],
    enemies: [],
    pressedLeft: false,
    pressedRight: false,
    player: {
      x: 132,
      y: 0,
      width: 34,
      height: 44,
      scale: 1,
      vx: 0,
      vy: 0,
      onGround: false,
      jumpsLeft: 2,
      facing: 1
    }
  };

  const skyLayers = [
    { x: 80, y: 54, width: 88, height: 28, speed: 0.15 },
    { x: 270, y: 78, width: 100, height: 30, speed: 0.22 },
    { x: 540, y: 48, width: 94, height: 26, speed: 0.12 },
    { x: 760, y: 88, width: 86, height: 24, speed: 0.18 }
  ];

  function currentMap() {
    return maps.find((item) => item.id === selectedMapId) || maps[0];
  }

  function ensureSprintInfoModal() {
    if (infoModal) return infoModal;
    const wrap = document.createElement("div");
    wrap.className = "sprint-modal";
    wrap.innerHTML = `<div class="sprint-modal-card"><p class="leaderboard-kicker" id="sprint-modal-kicker"></p><h2 id="sprint-modal-title"></h2><div class="sprint-modal-look"><div class="sprint-modal-art" id="sprint-modal-art"></div></div><p id="sprint-modal-look"></p><p id="sprint-modal-story"></p><p id="sprint-modal-power"></p><div class="sprint-modal-actions"><button class="action-button" id="sprint-modal-action" type="button">Use</button><button class="action-button secondary-button" id="sprint-modal-close" type="button">Close</button></div></div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener("click", (event) => { if (event.target === wrap) wrap.classList.remove("open"); });
    wrap.querySelector("#sprint-modal-close").addEventListener("click", () => wrap.classList.remove("open"));
    infoModal = wrap;
    return wrap;
  }

  function currentCharacter() {
    return characters.find((item) => item.id === selectedCharacterId) || characters[0];
  }

  function isUnlocked(item) {
    return best >= item.unlock;
  }

  function pickUnlocked(preferredId, items) {
    const preferred = items.find((item) => item.id === preferredId && isUnlocked(item));
    if (preferred) return preferred.id;
    return items.filter(isUnlocked)[0]?.id || items[0].id;
  }

  function currentPowerStats() {
    const character = currentCharacter();
    const stats = { maxJumps: 2, lives: 1, scale: 1, moveBoost: 0 };
    if (character.power.type === "jumps") stats.maxJumps = 3 + Math.floor(character.unlock / 4000);
    if (character.power.type === "lives") stats.lives = 2 + Math.floor(character.unlock / 4000);
    if (character.power.type === "size") stats.scale = Math.max(0.68, 0.9 - Math.floor(character.unlock / 4000) * 0.04);
    if (character.power.type === "speed") stats.moveBoost = 0.15 + Math.floor(character.unlock / 4000) * 0.06;
    return stats;
  }

  function showSprintInfo(item, kind) {
    const unlocked = isUnlocked(item);
    detailKicker.textContent = kind === "map" ? "Map Story" : "Runner Story";
    detailTitle.textContent = item.name;
    detailLook.textContent = item.look;
    detailStory.textContent = item.story;
    detailPower.textContent = kind === "map"
      ? `World effect: ${item.name} gets tougher deeper into a run.`
      : `Power: ${item.power.title}. ${item.power.description}` + (unlocked ? "" : ` Need ${item.unlock} best to use it.`);
  }

  function updateBestUi() {
    bestNode.textContent = String(best);
  }

  function renderUnlockGrid(container, items, selectedId, kind) {
    if (!container) return;
    if (container.tagName === "SELECT") {
      container.innerHTML = items.map((item) => {
        const unlocked = isUnlocked(item);
        const selected = item.id === selectedId ? " selected" : "";
        const status = unlocked ? "Unlocked" : `Locked - need ${item.unlock} best`;
        return `<option value="${item.id}"${selected}>${item.name} - ${status}</option>`;
      }).join("");
      return;
    }
    container.innerHTML = items.map((item) => {
      const unlocked = isUnlocked(item);
      const selected = item.id === selectedId;
      const requirement = item.unlock ? `${item.unlock} best` : "Unlocked";
      return `
        <button class="unlock-option${selected ? " selected" : ""}${unlocked ? "" : " locked"}" type="button" data-id="${item.id}" data-kind="${kind}">
          <strong>${item.name}</strong>
          <span>${unlocked ? "left click to use + view" : `locked` }</span>
          <small>${requirement}</small>
        </button>
      `;
    }).join("");
  }

  function handleUnlockCardClick(button) {
    const id = button.dataset.id || "";
    const kind = button.dataset.kind || "character";
    const list = kind === "map" ? maps : characters;
    const item = list.find((entry) => entry.id === id);
    if (!item || state.running) return;
    showSprintInfo(item, kind);
    if (!isUnlocked(item)) {
      messageNode.textContent = `${item.name} unlocks at ${item.unlock} best.`;
      return;
    }
    if (kind === "map") {
      selectedMapId = item.id;
      localStorage.setItem(mapStorageKey, selectedMapId);
      messageNode.textContent = `Selected map: ${item.name}`;
    } else {
      selectedCharacterId = item.id;
      localStorage.setItem(characterStorageKey, selectedCharacterId);
      messageNode.textContent = `Selected runner: ${item.name}`;
    }
    refreshUnlocks();
    draw();
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".unlock-option");
    if (!button) return;
    handleUnlockCardClick(button);
  });

  function handleUnlockSelectChange(kind, id) {
    const list = kind === "map" ? maps : characters;
    const item = list.find((entry) => entry.id === id);
    if (!item || state.running) return;
    showSprintInfo(item, kind);
    if (!isUnlocked(item)) {
      messageNode.textContent = `${item.name} unlocks at ${item.unlock} best.`;
      refreshUnlocks();
      return;
    }
    if (kind === "map") {
      selectedMapId = item.id;
      localStorage.setItem(mapStorageKey, selectedMapId);
      messageNode.textContent = `Selected map: ${item.name}`;
    } else {
      selectedCharacterId = item.id;
      localStorage.setItem(characterStorageKey, selectedCharacterId);
      messageNode.textContent = `Selected runner: ${item.name}`;
    }
    refreshUnlocks();
    draw();
  }

  if (mapGrid && mapGrid.tagName === "SELECT") {
    mapGrid.addEventListener("change", () => handleUnlockSelectChange("map", mapGrid.value));
  }
  if (characterGrid && characterGrid.tagName === "SELECT") {
    characterGrid.addEventListener("change", () => handleUnlockSelectChange("character", characterGrid.value));
  }

  function refreshUnlocks() {
    selectedMapId = pickUnlocked(selectedMapId, maps);
    selectedCharacterId = pickUnlocked(selectedCharacterId, characters);
    localStorage.setItem(mapStorageKey, selectedMapId);
    localStorage.setItem(characterStorageKey, selectedCharacterId);
    renderUnlockGrid(mapGrid, maps, selectedMapId, "map");
    renderUnlockGrid(characterGrid, characters, selectedCharacterId, "character");
  }

  function loseLife(reason) {
    state.lives -= 1;
    livesNode.textContent = String(Math.max(0, state.lives));
    if (state.lives > 0) {
      state.player.y = 160;
      state.player.vx = 0;
      state.player.vy = -3;
      state.player.onGround = false;
      state.player.jumpsLeft = currentPowerStats().maxJumps;
      messageNode.textContent = `${reason} Lives left: ${state.lives}`;
      return;
    }
    finishRun(reason);
  }

  

  function getPlayerBottom() {
    return state.player.y + state.player.height;
  }

  function createStartPlatforms() {
    state.platforms = [
      { x: -220, y: 260, width: 460, height: 60, style: "ground" },
      { x: 240, y: 260, width: 360, height: 60, style: "ground" },
      { x: 640, y: 236, width: 150, height: 84, style: "pipe" }
    ];
    state.coinsList = [
      { x: 328, y: 214, size: 9, taken: false },
      { x: 368, y: 192, size: 9, taken: false },
      { x: 408, y: 214, size: 9, taken: false },
      { x: 692, y: 192, size: 9, taken: false }
    ];
    state.enemies = [
      { x: 520, y: 236, width: 28, height: 24, dir: -1, speed: 0.7, minX: 470, maxX: 580, squashed: false }
    ];
    state.nextChunkX = 840;
  }

  function addChunk() {
    const map = currentMap();
    const baseX = state.nextChunkX;
    const difficulty = Math.min(1, state.score / 1200);
    const gap = Math.round(24 + map.gapBoost + difficulty * 26 + Math.random() * (34 + difficulty * 18));
    const width = Math.max(150, Math.round(280 - map.gapBoost * 1.2 - difficulty * 54 + Math.random() * (170 - difficulty * 34)));
    const raised = Math.random() < (0.18 + difficulty * 0.25 + map.enemyBoost * 0.25);
    const platformY = raised ? 244 - Math.floor(Math.random() * (8 + difficulty * 22 + map.gapBoost * 0.2)) : 260;
    const startX = baseX + gap;
    const platform = {
      x: startX,
      y: platformY,
      width,
      height: canvas.height - platformY,
      style: Math.random() < (0.18 + difficulty * 0.1) ? "pipe" : "ground"
    };
    state.platforms.push(platform);

    const coinCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < coinCount; i += 1) {
      state.coinsList.push({
        x: startX + 34 + (i * Math.max(24, (width - 70) / coinCount)),
        y: platformY - 34 - (i % 2) * 18,
        size: 9,
        taken: false
      });
    }

    if (width > 210 && Math.random() < (0.24 + difficulty * 0.34 + map.enemyBoost)) {
      state.enemies.push({
        x: startX + 46 + Math.random() * Math.max(20, width - 92),
        y: platformY - 24,
        width: 28,
        height: 24,
        dir: Math.random() < 0.5 ? -1 : 1,
        speed: 0.48 + difficulty * 0.55 + map.enemyBoost + Math.random() * 0.32,
        minX: startX + 18,
        maxX: startX + width - 46,
        squashed: false
      });
    }

    if (Math.random() < (0.18 + difficulty * 0.28 + map.enemyBoost * 0.4)) {
      state.platforms.push({
        x: startX + 48 + Math.random() * Math.max(30, width - 130),
        y: platformY - 72 - Math.floor(Math.random() * 20),
        width: 72,
        height: 16,
        style: "brick"
      });
    }

    state.nextChunkX = startX + width;
  }

  function resetGame() {
    const power = currentPowerStats();
    hideResultModal();
    state.running = true;
    state.frame = 0;
    state.worldX = 0;
    state.score = 0;
    state.coins = 0;
    state.lives = power.lives;
    state.player.y = 160;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.onGround = false;
    state.player.scale = power.scale;
    state.player.width = Math.round(34 * power.scale);
    state.player.height = Math.round(44 * power.scale);
    state.player.jumpsLeft = power.maxJumps;
    state.player.facing = 1;
    state.pressedLeft = false;
    state.pressedRight = false;
    createStartPlatforms();
    while (state.nextChunkX < 2100) addChunk();
    scoreNode.textContent = "0";
    coinsNode.textContent = "0";
    livesNode.textContent = String(state.lives);
    messageNode.textContent = `${currentMap().name} with ${currentCharacter().name}`;
    draw();
  }

  function jump() {
    if (!state.running) return;
    if (state.player.jumpsLeft > 0) {
      state.player.vy = -11.4 - Math.max(0, (currentPowerStats().maxJumps - 2) * 0.3);
      state.player.onGround = false;
      state.player.jumpsLeft -= 1;
    }
  }

  function holdDirection(direction, pressed) {
    if (direction === "left") state.pressedLeft = pressed;
    if (direction === "right") state.pressedRight = pressed;
  }

  function playerRect() {
    return {
      x: state.player.x,
      y: state.player.y,
      width: state.player.width,
      height: state.player.height
    };
  }

  function intersects(a, b) {
    return !(
      a.x + a.width < b.x ||
      a.x > b.x + b.width ||
      a.y + a.height < b.y ||
      a.y > b.y + b.height
    );
  }

  function drawRoundedRect(x, y, w, h, r, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  function drawCloud(x, y, scale) {
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.arc(x, y, 12 * scale, 0, Math.PI * 2);
    ctx.arc(x + 16 * scale, y - 6 * scale, 14 * scale, 0, Math.PI * 2);
    ctx.arc(x + 34 * scale, y, 12 * scale, 0, Math.PI * 2);
    ctx.arc(x + 18 * scale, y + 7 * scale, 14 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlayer() {
    const p = state.player;
    const character = currentCharacter();
    const stride = p.onGround && state.running && state.frame % 18 < 9 ? 4 : 0;
    ctx.fillStyle = "rgba(70, 32, 18, 0.16)";
    ctx.beginPath();
    ctx.ellipse(p.x + 17, p.y + p.height + 6, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    drawRoundedRect(p.x + 7, p.y + 1, 20, 10, 4, character.hat);
    ctx.fillStyle = character.hat;
    ctx.fillRect(p.x + 4, p.y + 8, 26, 4);

    drawRoundedRect(p.x + 8, p.y + 12, 18, 14, 5, character.skin);
    ctx.fillStyle = "#3a2418";
    ctx.fillRect(p.x + 6, p.y + 12, 6, 8);
    ctx.fillRect(p.x + 22, p.y + 12, 4, 6);
    ctx.fillRect(p.x + 14, p.y + 18, 8, 4);
    ctx.fillRect(p.x + 18, p.y + 16, 2, 2);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(p.x + 20 + (p.facing > 0 ? 2 : -2), p.y + 16, 3, 3);
    ctx.fillStyle = character.suit;
    ctx.fillRect(p.x + 8, p.y + 26, 18, 10);
    ctx.fillRect(p.x + 10, p.y + 36, 6, 8 + stride);
    ctx.fillRect(p.x + 18, p.y + 36, 6, 8 - stride);
    ctx.fillStyle = character.skin;
    ctx.fillRect(p.x + 7, p.y + 28, 4, 8);
    ctx.fillRect(p.x + 23, p.y + 28, 4, 8);
    ctx.fillStyle = character.boots;
    ctx.fillRect(p.x + 9, p.y + 43, 8, 3);
    ctx.fillRect(p.x + 18, p.y + 43, 8, 3);
  }

  function draw() {
    const map = currentMap();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, map.skyTop);
    sky.addColorStop(0.62, map.skyBottom);
    sky.addColorStop(1, map.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sun = ctx.createRadialGradient(110, 72, 10, 110, 72, 55);
    sun.addColorStop(0, "rgba(255,251,196,1)");
    sun.addColorStop(0.45, "rgba(255,217,108,0.92)");
    sun.addColorStop(1, "rgba(255,217,108,0)");
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(110, 72, 55, 0, Math.PI * 2);
    ctx.fill();

    skyLayers.forEach((cloud, index) => {
      const x = (cloud.x - state.worldX * cloud.speed) % (canvas.width + 140);
      drawCloud(x < -120 ? x + canvas.width + 140 : x, cloud.y + Math.sin((state.frame + index * 12) * 0.01) * 2, cloud.width / 88);
    });

    ctx.fillStyle = map.groundTop;
    ctx.fillRect(0, 238, canvas.width, 10);
    ctx.fillStyle = map.groundBottom;
    ctx.fillRect(0, 246, canvas.width, 12);

    state.platforms.forEach((platform) => {
      const x = Math.round(platform.x - state.worldX);
      if (x + platform.width < -40 || x > canvas.width + 40) return;
      if (platform.style === "brick") {
        drawRoundedRect(x, platform.y, platform.width, platform.height, 4, map.accent);
        ctx.fillStyle = "rgba(104, 56, 28, 0.45)";
        for (let row = 0; row < 2; row += 1) {
          ctx.fillRect(x + 6, platform.y + 4 + row * 7, platform.width - 12, 2);
        }
      } else if (platform.style === "pipe") {
        drawRoundedRect(x, platform.y + 12, platform.width, platform.height - 12, 9, map.pipe);
        drawRoundedRect(x - 8, platform.y, platform.width + 16, 20, 10, map.groundTop);
        ctx.fillStyle = "rgba(255,255,255,0.24)";
        ctx.fillRect(x + 10, platform.y + 18, 8, platform.height - 24);
      } else {
        drawRoundedRect(x, platform.y, platform.width, platform.height, 10, map.platform);
        ctx.fillStyle = map.accent;
        ctx.fillRect(x, platform.y, platform.width, 14);
        ctx.fillStyle = "rgba(98, 52, 20, 0.34)";
        for (let i = 12; i < platform.width; i += 34) {
          ctx.fillRect(x + i, platform.y + 18, 3, platform.height - 28);
        }
      }
    });

    state.coinsList.forEach((coin) => {
      if (coin.taken) return;
      const x = coin.x - state.worldX;
      if (x < -30 || x > canvas.width + 30) return;
      const bob = Math.sin((state.frame + coin.x) * 0.08) * 3;
      ctx.fillStyle = "#ffcf3f";
      ctx.beginPath();
      ctx.ellipse(x, coin.y + bob, coin.size, coin.size + 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff0a6";
      ctx.fillRect(x - 2, coin.y - 6 + bob, 4, 12);
    });

    state.enemies.forEach((enemy) => {
      if (enemy.squashed) return;
      const x = enemy.x - state.worldX;
      if (x < -40 || x > canvas.width + 40) return;
      ctx.fillStyle = "rgba(66, 35, 24, 0.16)";
      ctx.beginPath();
      ctx.ellipse(x + 14, enemy.y + enemy.height + 5, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      drawRoundedRect(x, enemy.y + 8, enemy.width, enemy.height - 8, 8, map.enemy);
      ctx.fillStyle = map.accent;
      ctx.fillRect(x + 3, enemy.y + 12, enemy.width - 6, 7);
      ctx.fillStyle = "#fff";
      ctx.fillRect(x + 6, enemy.y + 8, 5, 5);
      ctx.fillRect(x + 17, enemy.y + 8, 5, 5);
      ctx.fillStyle = "#2d1c14";
      ctx.fillRect(x + 8, enemy.y + 10, 2, 2);
      ctx.fillRect(x + 19, enemy.y + 10, 2, 2);
      ctx.fillRect(x + 5, enemy.y + enemy.height - 1, 6, 3);
      ctx.fillRect(x + 17, enemy.y + enemy.height - 1, 6, 3);
    });

    ctx.save();
    ctx.translate(state.player.x + state.player.width / 2, 0);
    ctx.scale(state.player.scale || 1, 1);
    ctx.translate(-(state.player.x + state.player.width / 2), 0);
    drawPlayer();
    ctx.restore();
  }

  function finishRun(reason) {
    state.running = false;
    cancelAnimationFrame(state.animation);
    const finalScore = state.score;
    if (finalScore > best) {
      best = finalScore;
      localStorage.setItem(bestStorageKey, String(best));
      updateBestUi();
      refreshUnlocks();
    }
    messageNode.textContent = reason;
    draw();
    showResultModal({
      title: "Platform Sprint Result",
      value: `${finalScore}`,
      detail: `${currentMap().name} - ${state.coins} coins with ${currentCharacter().name}`,
      onRetest: () => startButton.click(),
      leaderboard: {
        game: "platform-sprint",
        score: finalScore,
        display: `${finalScore}`,
        detail: `${currentMap().name} / ${currentCharacter().name}`,
        refresh: refreshLeaderboard
      }
    });
  }

  function updatePlayer() {
    const p = state.player;
    const power = currentPowerStats();
    const previousBottom = getPlayerBottom();
    p.vx = 0;
    if (state.pressedLeft) p.vx -= 1.8 + power.moveBoost;
    if (state.pressedRight) p.vx += 2.1 + power.moveBoost;
    if (p.vx !== 0) p.facing = p.vx > 0 ? 1 : -1;

    const map = currentMap();
    const difficulty = Math.min(1, state.score / 1200);
    const baseScroll = 3.5 + difficulty * (2.4 + map.speedBoost);
    state.worldX += Math.max(2.6, baseScroll + p.vx * 0.55);
    p.y += p.vy;
    p.vy += 0.74;
    p.onGround = false;

    state.platforms.forEach((platform) => {
      const rect = { x: platform.x - state.worldX, y: platform.y, width: platform.width, height: platform.height };
      const pRect = playerRect();
      const horizontalOverlap = pRect.x + pRect.width > rect.x + 4 && pRect.x < rect.x + rect.width - 4;
      const landingNow = previousBottom <= rect.y + 4 && p.y + p.height >= rect.y && horizontalOverlap && p.vy >= 0;
      if (landingNow) {
        p.y = rect.y - p.height;
        p.vy = 0;
        p.onGround = true;
        p.jumpsLeft = power.maxJumps;
      }
    });

    if (p.y > canvas.height + 30) {
      loseLife("missed the platform - press start to run again");
    }
  }

  function updateCoins() {
    const pRect = playerRect();
    state.coinsList.forEach((coin) => {
      if (coin.taken) return;
      const rect = { x: coin.x - state.worldX - coin.size, y: coin.y - coin.size, width: coin.size * 2, height: coin.size * 2 };
      if (intersects(pRect, rect)) {
        coin.taken = true;
        state.coins += 1;
        coinsNode.textContent = String(state.coins);
      }
    });
  }

  function updateEnemies() {
    const pRect = playerRect();
    const map = currentMap();
    for (const enemy of state.enemies) {
      if (enemy.squashed) continue;
      const difficultyBoost = Math.min(1, state.score / 1200) * (0.9 + map.enemyBoost);
      enemy.x += enemy.dir * (enemy.speed + difficultyBoost);
      if (enemy.x <= enemy.minX || enemy.x >= enemy.maxX) enemy.dir *= -1;
      const rect = { x: enemy.x - state.worldX, y: enemy.y, width: enemy.width, height: enemy.height };
      if (!intersects(pRect, rect)) continue;
      const stomp = state.player.vy > 2 && pRect.y + pRect.height - 10 < rect.y + 10;
      if (stomp) {
        enemy.squashed = true;
        state.player.vy = -8.6;
        state.score += 35;
      } else {
        loseLife("bumped by a monster - press start to run again");
        return;
      }
    }
  }

  function cleanupWorld() {
    state.platforms = state.platforms.filter((platform) => platform.x + platform.width > state.worldX - 180);
    state.coinsList = state.coinsList.filter((coin) => !coin.taken || coin.x > state.worldX - 220);
    state.enemies = state.enemies.filter((enemy) => !enemy.squashed && enemy.x + enemy.width > state.worldX - 220);
    while (state.nextChunkX - state.worldX < 1300) addChunk();
  }

  function tick() {
    if (!state.running) return;
    state.frame += 1;
    updatePlayer();
    if (!state.running) return;
    updateCoins();
    updateEnemies();
    if (!state.running) return;
    cleanupWorld();
    state.score = Math.max(state.score, Math.floor(state.worldX / 14) + state.coins * 20);
    scoreNode.textContent = String(state.score);
    draw();
    state.animation = requestAnimationFrame(tick);
  }

  function bindHold(button, direction) {
    if (!button) return;
    const start = (event) => {
      event.preventDefault();
      holdDirection(direction, true);
    };
    const stop = (event) => {
      if (event) event.preventDefault();
      holdDirection(direction, false);
    };
    button.addEventListener("mousedown", start);
    button.addEventListener("mouseup", stop);
    button.addEventListener("mouseleave", stop);
    button.addEventListener("touchstart", start, { passive: false });
    button.addEventListener("touchend", stop, { passive: false });
    button.addEventListener("touchcancel", stop, { passive: false });
  }

  bindHold(leftButton, "left");
  bindHold(rightButton, "right");

  if (jumpButton) {
    jumpButton.addEventListener("click", jump);
    jumpButton.addEventListener("touchstart", (event) => {
      event.preventDefault();
      jump();
    }, { passive: false });
  }

  canvas.addEventListener("click", jump);
  canvas.addEventListener("touchstart", (event) => {
    event.preventDefault();
    jump();
  }, { passive: false });

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (!["arrowleft", "arrowright", "a", "d", " ", "arrowup", "w"].includes(key)) return;
    event.preventDefault();
    if (key === "arrowleft" || key === "a") holdDirection("left", true);
    if (key === "arrowright" || key === "d") holdDirection("right", true);
    if (key === " " || key === "arrowup" || key === "w") jump();
  });

  document.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();
    if (key === "arrowleft" || key === "a") holdDirection("left", false);
    if (key === "arrowright" || key === "d") holdDirection("right", false);
  });

  startButton.addEventListener("click", () => {
    cancelAnimationFrame(state.animation);
    resetGame();
    state.animation = requestAnimationFrame(tick);
  });

  updateBestUi();
  refreshUnlocks();
  showSprintInfo(currentCharacter(), "character");
  livesNode.textContent = String(currentPowerStats().lives);
  draw();
}


















function setupCarRacing() {
  const canvas = document.getElementById("racing-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const distanceNode = document.getElementById("racing-distance");
  const bestNode = document.getElementById("racing-best");
  const messageNode = document.getElementById("racing-message");
  const startButton = document.getElementById("racing-start");
  const leftButton = document.getElementById("racing-left");
  const rightButton = document.getElementById("racing-right");
  const refreshLeaderboard = setupLeaderboard("car-racing", "Top Car Racing Scores", (entry) => entry.display || `${entry.score} meters`);
  const bestStorageKey = "tech_premi_car_racing_best";
  let best = Number(localStorage.getItem(bestStorageKey) || 0);
  bestNode.textContent = String(best);
  const state = {
    running: false, frame: 0, animation: null, distance: 0, score: 0, speed: 0,
    baseSpeed: 8, maxSpeed: 12, player: { x: 144, y: 380, width: 32, height: 48, vx: 0 },
    lane: 1, lanes: [64, 144, 224], cars: [], roadOffset: 0, difficulty: 1
  };
  const carColors = ["#e74c3c", "#3498db", "#27ae60", "#f39c12", "#9b59b6"];
  function resetGame() {
    hideResultModal();
    state.running = true; state.frame = 0; state.distance = 0; state.score = 0;
    state.speed = 0; state.player.x = state.lanes[1]; state.player.y = 380;
    state.player.vx = 0; state.lane = 1; state.cars = []; state.roadOffset = 0;
    state.difficulty = 1; distanceNode.textContent = "0"; messageNode.textContent = "avoid the traffic"; draw();
  }
  function changeDir(direction) {
    if (!state.running) return;
    if (direction === "left" && state.lane > 0) {
      state.lane -= 1; state.player.x = state.lanes[state.lane]; state.player.vx = -2;
    }
    if (direction === "right" && state.lane < 2) {
      state.lane += 1; state.player.x = state.lanes[state.lane]; state.player.vx = 2;
    }
  }
  function drawCar(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(x + 2, y + 8, width - 4, 15);
    ctx.fillStyle = "#333";
    ctx.fillRect(x + 4, y + 6, 6, 6);
    ctx.fillRect(x + width - 10, y + 6, 6, 6);
    ctx.fillRect(x + 4, y + height - 8, 6, 6);
    ctx.fillRect(x + width - 10, y + height - 8, 6, 6);
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + 6, y + 2, 6, 2);
    ctx.fillRect(x + width - 12, y + 2, 6, 2);
  }
  function addCar() {
    const targetLane = Math.floor(Math.random() * 3);
    const color = carColors[Math.floor(Math.random() * carColors.length)];
    state.cars.push({
      x: state.lanes[targetLane], y: -60, width: 32, height: 48,
      speed: 4 + Math.random() * 3 + state.difficulty * 1.5, color: color, lane: targetLane
    });
  }
  function updateCars() {
    state.cars = state.cars.filter((car) => { car.y += car.speed; return car.y < canvas.height + 60; });
    const spawnRate = Math.max(30, 100 - state.difficulty * 15);
    if (state.frame % spawnRate === 0) addCar();
  }
  function checkCollisions() {
    const playerRect = { x: state.player.x, y: state.player.y, width: state.player.width, height: state.player.height };
    for (const car of state.cars) {
      const carRect = { x: car.x, y: car.y, width: car.width, height: car.height };
      if (playerRect.x < carRect.x + carRect.width && playerRect.x + playerRect.width > carRect.x &&
          playerRect.y < carRect.y + carRect.height && playerRect.y + playerRect.height > carRect.y) {
        finishRun();
        return true;
      }
    }
    return false;
  }
  function updateDistance() {
    state.speed = Math.min(state.maxSpeed, state.baseSpeed + state.difficulty * 0.8);
    state.distance += state.speed * 0.34;
    state.score = Math.floor(state.distance);
    state.difficulty = 1 + Math.floor(state.score / 400);
    state.roadOffset = (state.roadOffset + state.speed) % 40;
    distanceNode.textContent = String(Math.floor(state.distance));
  }
  function draw() {
    ctx.fillStyle = "#1a1a1a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 120);
    skyGrad.addColorStop(0, "#87ceeb"); skyGrad.addColorStop(1, "#e0f4ff");
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, 120);
    ctx.fillStyle = "rgba(255, 200, 50, 0.8)";
    ctx.beginPath(); ctx.arc(canvas.width - 60, 40, 35, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#d4a574";
    for (let i = 0; i < canvas.height; i += 40) {
      const offset = (state.roadOffset + i) % 40;
      const roadY = i - offset + state.roadOffset;
      ctx.fillRect(0, roadY, canvas.width, 20);
    }
    ctx.strokeStyle = "#ffff00"; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.moveTo(144, 0); ctx.lineTo(144, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(224, 0); ctx.lineTo(224, canvas.height); ctx.stroke();
    ctx.setLineDash([]);
    state.cars.forEach((car) => drawCar(car.x, car.y, car.width, car.height, car.color));
    drawCar(state.player.x, state.player.y, state.player.width, state.player.height, "#34495e");
    ctx.fillStyle = "rgba(255, 165, 0, 0.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  function finishRun() {
    state.running = false; cancelAnimationFrame(state.animation);
    const finalScore = Math.floor(state.distance);
    if (finalScore > best) {
      best = finalScore;
      localStorage.setItem(bestStorageKey, String(best));
      bestNode.textContent = String(best);
    }
    messageNode.textContent = "crash! tap start to race again";
    draw();
    showResultModal({
      title: "Car Racing Result",
      value: `${finalScore} meters`,
      detail: `Difficulty: ${Math.floor(state.difficulty)}x`,
      onRetest: () => startButton.click(),
      leaderboard: {
        game: "car-racing",
        score: finalScore,
        display: `${finalScore} meters`,
        detail: `Racing distance`,
        refresh: refreshLeaderboard
      }
    });
  }
  function tick() {
    if (!state.running) return;
    state.frame += 1; state.player.x += state.player.vx; state.player.vx *= 0.88;
    updateDistance(); updateCars();
    const hitCar = checkCollisions();
    if (hitCar) { cancelAnimationFrame(state.animation); return; }
    draw();
    state.animation = requestAnimationFrame(tick);
  }
  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "arrowleft" || key === "a") changeDir("left");
    if (key === "arrowright" || key === "d") changeDir("right");
  });
  leftButton.addEventListener("click", () => changeDir("left"));
  rightButton.addEventListener("click", () => changeDir("right"));
  startButton.addEventListener("click", () => {
    if (state.animation) cancelAnimationFrame(state.animation);
    resetGame();
    state.animation = requestAnimationFrame(tick);
  });
  draw();
}

 function setupCarRacing(){const canvas=document.getElementById("racing-canvas");if(!canvas)return;const ctx=canvas.getContext("2d");const distanceNode=document.getElementById("racing-distance");const bestNode=document.getElementById("racing-best");const messageNode=document.getElementById("racing-message");const startButton=document.getElementById("racing-start");const leftButton=document.getElementById("racing-left");const rightButton=document.getElementById("racing-right");const refreshLeaderboard=setupLeaderboard("car-racing","Top Car Racing Scores",(entry)=>entry.display||`${entry.score} meters`);const bestStorageKey="tech_premi_car_racing_best";let best=Number(localStorage.getItem(bestStorageKey)||0);bestNode.textContent=String(best);const state={running:false,frame:0,animation:null,distance:0,score:0,speed:0,baseSpeed:8,maxSpeed:12,player:{x:144,y:380,width:32,height:48,vx:0},lane:1,lanes:[64,144,224],cars:[],roadOffset:0,difficulty:1};const carColors=["#e74c3c","#3498db","#27ae60","#f39c12","#9b59b6"];function resetGame(){hideResultModal();state.running=true;state.frame=0;state.distance=0;state.score=0;state.speed=0;state.player.x=state.lanes[1];state.player.y=380;state.player.vx=0;state.lane=1;state.cars=[];state.roadOffset=0;state.difficulty=1;distanceNode.textContent="0";messageNode.textContent="avoid the traffic";draw()}function changeDir(direction){if(!state.running)return;if(direction==="left"&&state.lane>0){state.lane-=1;state.player.x=state.lanes[state.lane];state.player.vx=-2}if(direction==="right"&&state.lane<2){state.lane+=1;state.player.x=state.lanes[state.lane];state.player.vx=2}}function drawCar(x,y,width,height,color){ctx.fillStyle=color;ctx.fillRect(x,y,width,height);ctx.fillStyle="rgba(0, 0, 0, 0.3)";ctx.fillRect(x+2,y+8,width-4,15);ctx.fillStyle="#333";ctx.fillRect(x+4,y+6,6,6);ctx.fillRect(x+width-10,y+6,6,6);ctx.fillRect(x+4,y+height-8,6,6);ctx.fillRect(x+width-10,y+height-8,6,6);ctx.fillStyle="#fff";ctx.fillRect(x+6,y+2,6,2);ctx.fillRect(x+width-12,y+2,6,2)}function addCar(){const targetLane=Math.floor(Math.random()*3);const color=carColors[Math.floor(Math.random()*carColors.length)];state.cars.push({x:state.lanes[targetLane],y:-60,width:32,height:48,speed:4+Math.random()*3+state.difficulty*1.5,color:color,lane:targetLane})}function updateCars(){state.cars=state.cars.filter((car)=>{car.y+=car.speed;return car.y<canvas.height+60});const spawnRate=Math.max(30,100-state.difficulty*15);if(state.frame%spawnRate===0)addCar()}function checkCollisions(){const playerRect={x:state.player.x,y:state.player.y,width:state.player.width,height:state.player.height};for(const car of state.cars){const carRect={x:car.x,y:car.y,width:car.width,height:car.height};if(playerRect.x<carRect.x+carRect.width&&playerRect.x+playerRect.width>carRect.x&&playerRect.y<carRect.y+carRect.height&&playerRect.y+playerRect.height>carRect.y){finishRun();return true}}return false}function updateDistance(){state.speed=Math.min(state.maxSpeed,state.baseSpeed+state.difficulty*0.8);state.distance+=state.speed*0.34;state.score=Math.floor(state.distance);state.difficulty=1+Math.floor(state.score/400);state.roadOffset=(state.roadOffset+state.speed)%40;distanceNode.textContent=String(Math.floor(state.distance))}function draw(){ctx.fillStyle="#1a1a1a";ctx.fillRect(0,0,canvas.width,canvas.height);const skyGrad=ctx.createLinearGradient(0,0,0,120);skyGrad.addColorStop(0,"#87ceeb");skyGrad.addColorStop(1,"#e0f4ff");ctx.fillStyle=skyGrad;ctx.fillRect(0,0,canvas.width,120);ctx.fillStyle="rgba(255, 200, 50, 0.8)";ctx.beginPath();ctx.arc(canvas.width-60,40,35,0,Math.PI*2);ctx.fill();ctx.fillStyle="#d4a574";for(let i=0;i<canvas.height;i+=40){const offset=(state.roadOffset+i)%40;const roadY=i-offset+state.roadOffset;ctx.fillRect(0,roadY,canvas.width,20)}ctx.strokeStyle="#ffff00";ctx.lineWidth=2;ctx.setLineDash([10,10]);ctx.beginPath();ctx.moveTo(144,0);ctx.lineTo(144,canvas.height);ctx.stroke();ctx.beginPath();ctx.moveTo(224,0);ctx.lineTo(224,canvas.height);ctx.stroke();ctx.setLineDash([]);state.cars.forEach((car)=>drawCar(car.x,car.y,car.width,car.height,car.color));drawCar(state.player.x,state.player.y,state.player.width,state.player.height,"#34495e");ctx.fillStyle="rgba(255, 165, 0, 0.4)";ctx.fillRect(0,0,canvas.width,canvas.height)}function finishRun(){state.running=false;cancelAnimationFrame(state.animation);const finalScore=Math.floor(state.distance);if(finalScore>best){best=finalScore;localStorage.setItem(bestStorageKey,String(best));bestNode.textContent=String(best)}messageNode.textContent="crash! tap start to race again";draw();showResultModal({title:"Car Racing Result",value:`${finalScore} meters`,detail:`Difficulty: ${Math.floor(state.difficulty)}x`,onRetest:()=>startButton.click(),leaderboard:{game:"car-racing",score:finalScore,display:`${finalScore} meters`,detail:"Racing distance",refresh:refreshLeaderboard}})}function tick(){if(!state.running)return;state.frame+=1;state.player.x+=state.player.vx;state.player.vx*=0.88;updateDistance();updateCars();const hitCar=checkCollisions();if(hitCar){cancelAnimationFrame(state.animation);return}draw();state.animation=requestAnimationFrame(tick)}document.addEventListener("keydown",(event)=>{const key=event.key.toLowerCase();if(key==="arrowleft"||key==="a")changeDir("left");if(key==="arrowright"||key==="d")changeDir("right")});leftButton.addEventListener("click",()=>changeDir("left"));rightButton.addEventListener("click",()=>changeDir("right"));startButton.addEventListener("click",()=>{if(state.animation)cancelAnimationFrame(state.animation);resetGame();state.animation=requestAnimationFrame(tick)});draw()}
