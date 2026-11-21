/* =========================================================
   COMPUTER MAY CRY — Cruzadinha do Caçador
   HTML + CSS + JavaScript puros
   ========================================================= */

// ---------- Dados do tabuleiro (posições validadas) e pistas ----------
const WORDS = [
  { word: "MEMORIADEMASSA", row: 0, col: 0, dir: "V", clue: "Dispositivo de grande capacidade e baixa velocidade, como HD ou SSD, que guarda arquivos." },
  { word: "DATABUS", row: 0, col: 6, dir: "V", clue: "Via bidirecional que carrega o conteúdo trocado entre CPU, memória e periféricos." },
  { word: "FLASH", row: 1, col: 4, dir: "H", clue: "Memória não volátil regravável em blocos, usada em pen drives e SSDs." },
  { word: "REGISTRADORES", row: 2, col: 9, dir: "V", clue: "Minúsculas áreas dentro da CPU, rapidíssimas, que guardam dados em uso imediato." },
  { word: "MICROCONTROLADOR", row: 3, col: 3, dir: "V", clue: "Chip único com CPU, memória e portas de entrada e saída, típico de sistemas embarcados." },
  { word: "RAM", row: 3, col: 5, dir: "H", clue: "Memória principal e volátil: perde o conteúdo quando a energia acaba." },
  { word: "ADDRESSBUS", row: 6, col: 0, dir: "H", clue: "Via de sentido único que informa a posição de memória a ser lida ou escrita." },
  { word: "DUALCORE", row: 9, col: 7, dir: "V", clue: "Chip com duas unidades de processamento independentes, que trabalham em paralelo." },
  { word: "DMA", row: 9, col: 7, dir: "H", clue: "Técnica que deixa periféricos trocarem dados com a memória sem ocupar a CPU." },
  { word: "ROM", row: 9, col: 2, dir: "H", clue: "Memória gravada na fábrica, imutável pelo usuário, que mantém o conteúdo sem energia." },
  { word: "CPU", row: 10, col: 5, dir: "H", clue: "Cérebro do computador: busca, decodifica e executa as instruções dos programas." },
  { word: "UC", row: 12, col: 5, dir: "V", clue: "Parte da CPU que interpreta instruções e comanda os demais componentes." },
  { word: "CACHE", row: 13, col: 5, dir: "H", clue: "Memória pequena e muito rápida entre CPU e RAM que guarda o mais usado." },
  { word: "ULA", row: 14, col: 2, dir: "H", clue: "Parte da CPU que faz as contas e as operações lógicas." },
  { word: "QUADCORE", row: 16, col: 0, dir: "H", clue: "Chip com quatro unidades de processamento independentes, que trabalham em paralelo." },
  { word: "EEPROM", row: 18, col: 0, dir: "H", clue: "Memória não volátil regravável byte a byte, sem precisar retirar o chip da placa." },
];

const ROWS = 19;
const COLS = 10;

// ---------- Imagens (pasta assets/) ----------
// Para trocar uma imagem, salve o arquivo com o mesmo nome na pasta assets/.
const ASSETS = {
  card: "assets/protagonista-card1.png",
  introHero: "assets/protagonista-cruzadinha-intro1.png",
  introRival: "assets/rival-cruzadinha-intro1.png",
  idle: "assets/protagonista-cruzadinha-jogo1.png",
  think: "assets/protagonista-cruzadinha-pensando1.png",
  win: "assets/protagonista-cruzadinha-comemorando1.png",
  rival: "assets/rival-cruzadinha-jogo1.png",
  victory: "assets/protagonista-cruzadinha-vitoria1.png",
  bg: "assets/cenario-cruzadinha1.png",
  card2: "assets/cacadora-card2.png",
  huntress: "assets/cacadora-normal.png",
  huntressHit: "assets/cacadora-acerto.png",
  huntressMiss: "assets/cacadora-erro.png",
  huntressIntro: "assets/cacadora-intro2.png",
  card3: "assets/rival-card3.png",
  rival3Intro: "assets/rival-intro3.png",
  rivalIdle: "assets/rival-normal.png",
  rivalCut: "assets/rival-corte.png",
  rivalMiss: "assets/rival-erro.png",
  victory3: "assets/vitoria-final.png",
  secret: "assets/secreto-dica.png",
};

// Carrega cada <img class="sprite">; se o arquivo não existir, mostra o placeholder.
function loadSprite(img, asset) {
  const slot = img.closest(".slot");
  img.dataset.asset = asset;
  delete img.dataset.triedFallback;
  img.onload = () => slot && slot.classList.remove("missing");
  img.onerror = () => {
    const fb = img.dataset.fallback;
    if (fb && !img.dataset.triedFallback && fb !== asset) {
      img.dataset.triedFallback = "1";
      img.src = ASSETS[fb];
      return;
    }
    if (slot) slot.classList.add("missing");
  };
  if (img.complete && img.naturalWidth > 0 && img.getAttribute("src") === ASSETS[asset]) {
    if (slot) slot.classList.remove("missing");
    return;
  }
  if (slot) slot.classList.add("missing");
  img.src = ASSETS[asset];
}

function initImages() {
  document.querySelectorAll("img.sprite").forEach((img) => loadSprite(img, img.dataset.asset));
  // cenário: só aparece por cima do desenho padrão se o arquivo existir
  const bg = $("bg-img");
  if (bg) {
    bg.style.display = "none";
    bg.onload = () => { bg.style.display = ""; };
    bg.onerror = () => { bg.style.display = "none"; };
    bg.src = ASSETS.bg;
  }
}

// ---------- Estado ----------
const cells = new Map();      // "r,c" -> { r, c, el, input, correct, wordIdx: [] }
let numberAt = new Map();     // "r,c" -> número
let activeWord = 0;
let activeKey = null;
let hints = 0;
let reveals = 0;
let checked = false;
let lastOk = 0;
let poseTimer = null;

const $ = (id) => document.getElementById(id);
const key = (r, c) => `${r},${c}`;
const cellsOf = (w) => {
  const out = [];
  for (let i = 0; i < w.word.length; i++) {
    out.push(w.dir === "H" ? cells.get(key(w.row, w.col + i)) : cells.get(key(w.row + i, w.col)));
  }
  return out;
};

// ---------- Construção ----------
function numberWords() {
  const starts = [...new Set(WORDS.map((w) => key(w.row, w.col)))];
  starts.sort((a, b) => {
    const [ra, ca] = a.split(",").map(Number);
    const [rb, cb] = b.split(",").map(Number);
    return ra - rb || ca - cb;
  });
  starts.forEach((k, i) => numberAt.set(k, i + 1));
  WORDS.forEach((w) => (w.num = numberAt.get(key(w.row, w.col))));
}

function buildBoard() {
  const board = $("board");
  board.style.gridTemplateColumns = `repeat(${COLS}, var(--cell))`;
  board.innerHTML = "";

  WORDS.forEach((w, idx) => {
    for (let i = 0; i < w.word.length; i++) {
      const r = w.dir === "V" ? w.row + i : w.row;
      const c = w.dir === "H" ? w.col + i : w.col;
      const k = key(r, c);
      if (!cells.has(k)) cells.set(k, { r, c, correct: w.word[i], wordIdx: [] });
      cells.get(k).wordIdx.push(idx);
    }
  });

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const k = key(r, c);
      if (!cells.has(k)) {
        const blank = document.createElement("div");
        blank.className = "blank";
        board.appendChild(blank);
        continue;
      }
      const cell = cells.get(k);
      const el = document.createElement("div");
      el.className = "cell";
      if (numberAt.has(k)) {
        const n = document.createElement("span");
        n.className = "num";
        n.textContent = numberAt.get(k);
        el.appendChild(n);
      }
      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 2;
      input.autocomplete = "off";
      input.autocapitalize = "characters";
      input.spellcheck = false;
      input.setAttribute("aria-label", `Linha ${r + 1}, coluna ${c + 1}`);
      input.dataset.key = k;
      el.appendChild(input);
      board.appendChild(el);
      cell.el = el;
      cell.input = input;
    }
  }
}

function buildClues() {
  const lists = { H: $("clues-h"), V: $("clues-v") };
  const sorted = WORDS.map((w, i) => ({ w, i })).sort((a, b) => a.w.num - b.w.num);
  sorted.forEach(({ w, i }) => {
    const li = document.createElement("li");
    li.dataset.idx = i;
    li.innerHTML = `<b>${w.num}</b><span>${w.clue}</span>`;
    li.addEventListener("click", () => selectWord(i, true));
    lists[w.dir].appendChild(li);
    w.li = li;
  });
}

// ---------- Seleção e destaque ----------
function selectWord(idx, focus) {
  activeWord = idx;
  const w = WORDS[idx];
  const list = cellsOf(w);
  const target = list.find((c) => !c.input.value) || list[0];
  activeKey = key(target.r, target.c);
  render();
  if (focus) target.input.focus();
}

function selectCell(k) {
  const cell = cells.get(k);
  const sameCell = activeKey === k;
  const current = WORDS[activeWord];
  let idx = cell.wordIdx.find((i) => i === activeWord);
  if (idx === undefined || (sameCell && cell.wordIdx.length > 1)) {
    // alterna a direção se clicar de novo na mesma casa de cruzamento
    const other = cell.wordIdx.find((i) => i !== activeWord);
    idx = other !== undefined ? other : cell.wordIdx[0];
  }
  activeWord = idx;
  activeKey = k;
  render();
}

function render() {
  const w = WORDS[activeWord];
  const inWord = new Set(cellsOf(w).map((c) => key(c.r, c.c)));
  cells.forEach((cell, k) => {
    cell.el.classList.toggle("in-word", inWord.has(k));
    cell.el.classList.toggle("active", k === activeKey);
  });
  WORDS.forEach((x, i) => x.li.classList.toggle("active", i === activeWord));
  $("current-clue").innerHTML =
    `<b>${w.num} ${w.dir === "H" ? "Horizontal" : "Vertical"}</b> · ${w.clue} <em>(${w.word.length} letras)</em>`;
}

// ---------- Teclado ----------
function normalizeLetter(v) {
  return v.normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase();
}

function moveInWord(step) {
  const list = cellsOf(WORDS[activeWord]);
  const i = list.findIndex((c) => key(c.r, c.c) === activeKey);
  const next = list[i + step];
  if (next) {
    activeKey = key(next.r, next.c);
    render();
    next.input.focus();
  }
}

function moveArrow(dr, dc) {
  const cell = cells.get(activeKey);
  let r = cell.r + dr, c = cell.c + dc;
  while (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
    const n = cells.get(key(r, c));
    if (n) {
      const dir = dr ? "V" : "H";
      const idx = n.wordIdx.find((i) => WORDS[i].dir === dir);
      if (idx !== undefined) activeWord = idx;
      activeKey = key(r, c);
      render();
      n.input.focus();
      return;
    }
    r += dr; c += dc;
  }
}

function clearMarks(cell) {
  cell.el.classList.remove("ok", "bad", "hint", "revealed");
}

function onBoardEvents() {
  const board = $("board");

  board.addEventListener("focusin", (e) => {
    if (e.target.tagName === "INPUT") selectCell(e.target.dataset.key);
  });
  board.addEventListener("mousedown", (e) => {
    const input = e.target.closest(".cell")?.querySelector("input");
    if (input && document.activeElement === input) selectCell(input.dataset.key);
  });

  board.addEventListener("input", (e) => {
    const input = e.target;
    if (input.tagName !== "INPUT") return;
    const cell = cells.get(input.dataset.key);
    const letter = normalizeLetter(input.value).slice(-1);
    input.value = letter;
    clearMarks(cell);
    if (letter) moveInWord(1);
  });

  board.addEventListener("keydown", (e) => {
    const input = e.target;
    if (input.tagName !== "INPUT") return;
    switch (e.key) {
      case "ArrowLeft": e.preventDefault(); moveArrow(0, -1); break;
      case "ArrowRight": e.preventDefault(); moveArrow(0, 1); break;
      case "ArrowUp": e.preventDefault(); moveArrow(-1, 0); break;
      case "ArrowDown": e.preventDefault(); moveArrow(1, 0); break;
      case "Backspace":
        if (!input.value) { e.preventDefault(); moveInWord(-1); const p = cells.get(activeKey); p.input.value = ""; clearMarks(p); }
        break;
      case "Tab": {
        e.preventDefault();
        selectWord((activeWord + (e.shiftKey ? WORDS.length - 1 : 1)) % WORDS.length, true);
        break;
      }
      case "Enter": e.preventDefault(); conferir(); break;
    }
  });
}

// ---------- Ações ----------
function wordState(w) {
  const letters = cellsOf(w).map((c) => c.input.value);
  if (letters.some((l) => !l)) return "pending";
  return letters.join("") === w.word ? "ok" : "bad";
}

function conferir() {
  cells.forEach(clearMarks);
  let ok = 0;
  const states = WORDS.map(wordState);
  // primeiro marca as erradas, depois as certas (o cruzamento certo prevalece)
  WORDS.forEach((w, i) => {
    if (states[i] === "bad") cellsOf(w).forEach((c) => c.el.classList.add("bad"));
  });
  WORDS.forEach((w, i) => {
    w.li.classList.remove("ok", "bad");
    if (states[i] === "ok") {
      ok++;
      cellsOf(w).forEach((c) => { c.el.classList.remove("bad"); c.el.classList.add("ok"); });
      w.li.classList.add("ok");
    } else if (states[i] === "bad") {
      w.li.classList.add("bad");
    }
  });
  checked = true;
  const wrong = states.filter((s) => s === "bad").length;
  const pending = states.filter((s) => s === "pending").length;
  if (ok > lastOk) { setPose("win", 1800); flashRank("SSS", "RANK SSS!"); }
  lastOk = ok;
  if (ok === WORDS.length) {
    say("JACKPOT! Rank SSS no estilo!");
    showVictory();
  } else {
    say(`${ok} certas, ${wrong} erradas, ${pending} incompletas. Vamos nessa!`);
    $("status").textContent = `${ok} de ${WORDS.length} palavras`;
  }
  $("status").textContent = `${ok} de ${WORDS.length} palavras`;
}

function dica() {
  const w = WORDS[activeWord];
  const target = cellsOf(w).find((c) => c.input.value !== c.correct);
  if (!target) { say("Essa palavra já está certa. Escolha outra pista!"); return; }
  target.input.value = target.correct;
  clearMarks(target);
  target.el.classList.add("hint");
  hints++;
  updateCounters();
  flashRank("S", "RANK S!");
  setPose("think", 2400);
  say("BINGO! Uma letra do código foi revelada.");
  target.input.focus();
}

function resposta() {
  const w = WORDS[activeWord];
  cellsOf(w).forEach((c) => {
    c.input.value = c.correct;
    clearMarks(c);
    c.el.classList.add("revealed");
  });
  reveals++;
  updateCounters();
  say("Palavra revelada. Talvez até mesmo um computador possa chorar...");
}

function reiniciar() {
  cells.forEach((cell) => { cell.input.value = ""; clearMarks(cell); });
  WORDS.forEach((w) => w.li.classList.remove("ok", "bad"));
  hints = 0; reveals = 0; checked = false; lastOk = 0;
  setPose("idle");
  $("status").textContent = `0 de ${WORDS.length} palavras`;
  $("victory").classList.add("hidden");
  updateCounters();
  say("Jogo reinciado. Isso não vai me impedir, Vergil!");
  selectWord(0, true);
}

function updateCounters() {
  $("hints").textContent = hints;
  $("reveals").textContent = reveals;
}

function say(text) { $("speech").textContent = text; }

function setPose(pose, ms) {
  const img = $("hero-main");
  if (!img) return;
  clearTimeout(poseTimer);
  img.dataset.fallback = pose === "idle" ? "" : "idle";
  loadSprite(img, pose);
  img.closest(".slot").classList.toggle("pose-" + pose, true);
  ["idle", "win", "think"].filter((p) => p !== pose)
    .forEach((p) => img.closest(".slot").classList.remove("pose-" + p));
  if (ms) poseTimer = setTimeout(() => setPose("idle"), ms);
}

// Rank final: dicas pesam 1 ponto, respostas reveladas pesam 3
function finalRank() {
  const penalty = hints + reveals * 3;
  if (penalty === 0) return "SSS";
  if (penalty <= 2) return "SS";
  if (penalty <= 4) return "S";
  if (penalty <= 9) return "A";
  return "B";
}

function showVictory() {
  setPose("win", 0);
  $("final-rank").textContent = finalRank();
  $("victory-text").textContent =
    `Você quebrou a criptografia usando ${hints} dica(s) e ${reveals} resposta(s) revelada(s).`;
  $("victory").classList.remove("hidden");
}

function flashRank(letter, text) {
  const el = $("rank-flash");
  el.querySelector("b").textContent = letter;
  el.querySelector("span").textContent = text;
  el.classList.remove("hidden", "pop");
  void el.offsetWidth; // reinicia a animação
  el.classList.add("pop");
  setTimeout(() => el.classList.add("hidden"), 1100);
}

// ---------- Telas ----------
const CONTEXT =
  "Vergil bloqueou o firewall principal com uma criptografia antiga baseada em arquitetura de computadores. " +
  "Antes de sacar a lâmina, Dante precisa decifrar os termos técnicos deixados por seu irmão para " +
  "quebrar a barreira de segurança e avançar no sistema.";

function typeContext(text) {
  const el = $("context");
  el.textContent = "";
  let i = 0;
  const timer = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) clearInterval(timer);
  }, 14);
}

let mode1Started = false;

function showScreen(name) {
  ["menu", "intro", "game", "intro2", "game2", "intro3", "game3", "secret"].forEach((id) => $(id).classList.toggle("hidden", id !== name));
  const labels = {
    menu: "ESCOLHA SEU MODO",
    intro: "MODO 1 · CRUZADINHA DE DANTE",
    game: "MODO 1 · CRUZADINHA DE DANTE",
    intro2: "MODO 2 · ARSENAL DE LADY",
    game2: "MODO 2 · ARSENAL DE LADY",
    intro3: "MODO 3 · TEMPESTADE DE VERGIL",
    game3: "MODO 3 · TEMPESTADE DE VERGIL",
    secret: "MODO SECRETO",
  };
  $("mode-label").textContent = labels[name];
  $("nav").classList.toggle("hidden", name === "menu");
  $("nav-m1").classList.toggle("current", name === "intro" || name === "game");
  $("nav-m2").classList.toggle("current", name === "intro2" || name === "game2");
  $("nav-m3").classList.toggle("current", name === "intro3" || name === "game3");
}

function goMode1() { showScreen(mode1Started ? "game" : "intro"); }
function goMode2() { showScreen(m2.started ? "game2" : "intro2"); }
function startMode2() {
  showScreen("game2");
  // retoma a rodada em andamento; se não houver uma, começa uma nova
  if (!m2.started || m2.over) { m2.started = true; m2NewRound(); }
}

function startGame() {
  mode1Started = true;
  showScreen("game");
  typeContext(CONTEXT);
  selectWord(0, true);
}

function init() {
  numberWords();
  buildBoard();
  buildClues();
  onBoardEvents();
  initImages();
  drawBackground();
  $("mode-2").addEventListener("click", () => showScreen("intro2"));
  $("nav-menu").addEventListener("click", () => showScreen("menu"));
  $("nav-m1").addEventListener("click", goMode1);
  $("nav-m2").addEventListener("click", goMode2);
  $("btn-back2").addEventListener("click", () => showScreen("menu"));
  $("btn-start2").addEventListener("click", startMode2);
  initMode2();
  initMode3();
  $("mode-1").addEventListener("click", () => showScreen("intro"));
  $("btn-back").addEventListener("click", () => showScreen("menu"));
  $("btn-start").addEventListener("click", startGame);
  $("btn-check").addEventListener("click", conferir);
  $("btn-hint").addEventListener("click", dica);
  $("btn-reveal").addEventListener("click", resposta);
  $("btn-reset").addEventListener("click", reiniciar);
  $("btn-again").addEventListener("click", reiniciar);
  $("status").textContent = `0 de ${WORDS.length} palavras`;
  updateCounters();
}

document.addEventListener("DOMContentLoaded", init);


// ---------- Cenário: interior da agência (pixel art 160x90) ----------
function drawBackground() {
  const cv = $("bg");
  if (!cv) return;
  const W = 160, H = 90;
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  const rect = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

  // parede de tijolos escuros
  rect("#1a0b22", 0, 0, W, 66);
  for (let y = 0; y < 66; y += 6) {
    for (let x = (y / 6) % 2 ? -6 : 0; x < W; x += 12) {
      rect("#241033", x + 1, y + 1, 10, 4);
    }
  }
  // piso de tábuas e rodapé
  rect("#0b0610", 0, 64, W, 3);
  rect("#2a1420", 0, 67, W, 23);
  for (let y = 67; y < H; y += 6) rect("#1a0b12", 0, y, W, 1);
  for (let y = 67, r = 0; y < H; y += 6, r++) {
    for (let x = (r % 2) * 14; x < W; x += 28) rect("#1a0b12", x, y, 1, 6);
  }

  // janela com lua e prédios
  rect("#0b0610", 116, 8, 34, 34);
  rect("#0f2a4a", 118, 10, 30, 30);
  rect("#f1e6ff", 138, 14, 5, 5);
  rect("#0f2a4a", 140, 14, 2, 2);
  [[118, 28, 6, 12], [125, 24, 5, 16], [131, 30, 7, 10], [139, 26, 5, 14], [145, 31, 3, 9]]
    .forEach(([x, y, w, h]) => rect("#07121f", x, y, w, h));
  rect("#0b0610", 132, 10, 2, 30);
  rect("#0b0610", 118, 24, 30, 2);
  rect("rgba(120,160,255,0.07)", 106, 42, 50, 24);

  // cartazes
  rect("#0b0610", 12, 14, 18, 24); rect("#4b1f7a", 14, 16, 14, 20);
  rect("#e0113a", 17, 21, 8, 8); rect("#0a0610", 20, 24, 2, 2);
  rect("#0b0610", 34, 20, 12, 16); rect("#14513a", 36, 22, 8, 12);
  rect("#ff8a1f", 38, 26, 4, 4);

  // luminária pendurada com brilho vermelho
  rect("#0b0610", 79, 0, 2, 10);
  rect("#8f0b26", 74, 10, 12, 4);
  rect("#e0113a", 76, 12, 8, 2);
  const glow = g.createRadialGradient(80, 14, 2, 80, 30, 44);
  glow.addColorStop(0, "rgba(224,17,58,0.35)"); glow.addColorStop(1, "rgba(224,17,58,0)");
  g.fillStyle = glow; g.fillRect(30, 0, 100, 70);

  // mesa
  rect("#0b0610", 52, 55, 70, 3);
  rect("#4a2a1a", 52, 56, 70, 4);
  rect("#33190f", 54, 60, 66, 16);
  rect("#0b0610", 54, 66, 66, 1);
  rect("#0b0610", 66, 61, 20, 5); rect("#8a8fa8", 67, 62, 18, 3); // gaveta

  // monitor retrô
  rect("#0b0610", 78, 34, 30, 22);
  rect("#cfc6b4", 79, 35, 28, 20);
  rect("#04140f", 81, 37, 24, 15);
  for (let i = 0; i < 4; i++) rect("#7dffb0", 83, 39 + i * 3, 8 + ((i * 7) % 12), 1);
  rect("#7dffb0", 100, 49, 3, 2);
  rect("#9d9482", 88, 55, 10, 2);
  // teclado e caneca
  rect("#0b0610", 80, 53, 26, 3); rect("#5a5a78", 81, 53, 24, 2);
  rect("#e0113a", 58, 49, 6, 6); rect("#0b0610", 64, 51, 2, 3);

  // vinheta de sombras nas laterais
  const v = g.createLinearGradient(0, 0, W, 0);
  v.addColorStop(0, "rgba(0,0,0,0.55)"); v.addColorStop(0.3, "rgba(0,0,0,0)");
  v.addColorStop(0.7, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.55)");
  g.fillStyle = v; g.fillRect(0, 0, W, H);
}

/* =========================================================
   MODO 2 — Arsenal da Caçadora (estilo "termo")
   ========================================================= */
const M2_TRIES = 6;
const M2_MIN_LEN = 3; // palavras menores (como UC) ficam de fora deste modo

const M2_CONTEXT =
  "Digite a senha exata do cofre. Você tem 6 disparos antes que o sistema bloqueie o arsenal!";

// Pistas curtas (até 15 palavras), sem a resposta
const M2_CLUES = {
  CPU: "O cérebro da máquina: busca e executa cada instrução dos programas.",
  ULA: "Setor da CPU responsável pelas contas e pelas decisões lógicas.",
  REGISTRADORES: "Gavetas ultrarrápidas dentro da CPU, guardando o que está em uso agora.",
  RAM: "Memória de trabalho do sistema: perde tudo quando a energia acaba.",
  ROM: "Memória gravada na fábrica; mantém o conteúdo mesmo sem energia.",
  EEPROM: "Memória permanente regravável byte a byte, sem tirar o chip da placa.",
  FLASH: "Memória permanente regravável em blocos, comum em pen drives e SSDs.",
  CACHE: "Memória pequena e ultrarrápida que guarda o que a CPU mais usa.",
  MEMORIADEMASSA: "Depósito de grande capacidade e baixa velocidade para arquivos: HD ou SSD.",
  DMA: "Atalho que deixa periféricos acessarem a memória sem incomodar a CPU.",
  ADDRESSBUS: "Via de mão única que diz à memória qual posição será lida ou escrita.",
  DATABUS: "Via de mão dupla que leva o conteúdo entre CPU, memória e periféricos.",
  MICROCONTROLADOR: "Chip completo em miniatura, com CPU e memória, que comanda aparelhos embarcados.",
  DUALCORE: "Processador com duas unidades de processamento trabalhando em paralelo no mesmo chip.",
  QUADCORE: "Processador com quatro unidades de processamento trabalhando em paralelo no mesmo chip.",
};

const M2_ROWS_KEYS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

const m2 = {
  started: false, word: "", last: "", row: 0, cur: "",
  over: false, busy: false, wins: 0, losses: 0, streak: 0,
  keyState: {}, poseTimer: null,
};

function typeText(el, text) {
  el.textContent = "";
  let i = 0;
  const timer = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) clearInterval(timer);
  }, 10);
}

function m2Say(text) { $("m2-speech").textContent = text; }

function m2SetPose(pose, ms) {
  const img = $("hero2-main");
  const slot = img.closest(".slot");
  clearTimeout(m2.poseTimer);
  const key = pose === "win" ? "huntressHit" : pose === "miss" ? "huntressMiss" : "huntress";
  img.dataset.fallback = pose === "idle" ? "" : "huntress";
  loadSprite(img, key);
  ["win", "miss"].forEach((p) => slot.classList.toggle("pose-" + p, p === pose));
  if (ms) m2.poseTimer = setTimeout(() => m2SetPose("idle"), ms);
}

function evalGuess(guess, answer) {
  const res = Array(guess.length).fill("miss");
  const left = {};
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) res[i] = "crit";
    else left[answer[i]] = (left[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < guess.length; i++) {
    if (res[i] !== "crit" && left[guess[i]] > 0) { res[i] = "bounce"; left[guess[i]]--; }
  }
  return res;
}

function m2Tiles(row) { return [...$("m2-grid").children[row].children]; }

function m2UpdateShot() {
  $("m2-shot").textContent = `${Math.min(m2.row + 1, M2_TRIES)} de ${M2_TRIES}`;
}

function m2NewRound() {
  const pool = Object.keys(M2_CLUES).filter((w) => w.length >= M2_MIN_LEN && w !== m2.last);
  m2.word = pool[Math.floor(Math.random() * pool.length)];
  m2.last = m2.word;
  m2.row = 0; m2.cur = ""; m2.over = false; m2.busy = false; m2.keyState = {};

  // tabuleiro com exatamente uma coluna por letra da palavra sorteada
  const grid = $("m2-grid");
  grid.style.setProperty("--cols", m2.word.length);
  grid.innerHTML = "";
  for (let r = 0; r < M2_TRIES; r++) {
    const row = document.createElement("div");
    row.className = "m2-row";
    for (let c = 0; c < m2.word.length; c++) {
      const t = document.createElement("div");
      t.className = "tile";
      row.appendChild(t);
    }
    grid.appendChild(row);
  }

  $("m2-clue").innerHTML =
    `<b>SENHA DE ${m2.word.length} LETRAS</b>${M2_CLUES[m2.word]}`;
  $("m2-msg").textContent = "";
  $("m2-new").textContent = "↻ NOVA SENHA";
  m2BuildKeys();
  m2UpdateShot();
  m2SetPose("idle");
  m2Say("Preciso daquele lança-foguetes... Qual é a senha que o Dante colocou mesmo?");
  if (!$("m2-context").textContent) typeText($("m2-context"), M2_CONTEXT);
}

function m2BuildKeys() {
  const box = $("m2-keys");
  box.innerHTML = "";
  M2_ROWS_KEYS.forEach((letters, i) => {
    const row = document.createElement("div");
    row.className = "m2-keyrow";
    if (i === 2) row.appendChild(m2Key("ENTER", "ENTER", "wide"));
    [...letters].forEach((l) => row.appendChild(m2Key(l, l)));
    if (i === 2) row.appendChild(m2Key("⌫", "BACK", "wide"));
    box.appendChild(row);
  });
}

function m2Key(label, value, extra) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "key" + (extra ? " " + extra : "");
  b.textContent = label;
  b.dataset.key = value;
  b.addEventListener("click", () => { m2Press(value); b.blur(); });
  return b;
}

function m2Press(value) {
  if (value === "ENTER") m2Submit();
  else if (value === "BACK") m2Back();
  else m2Type(value);
}

function m2Type(ch) {
  if (m2.over || m2.busy || m2.cur.length >= m2.word.length) return;
  m2.cur += ch;
  m2PaintCurrent();
}

function m2Back() {
  if (m2.over || m2.busy || !m2.cur) return;
  m2.cur = m2.cur.slice(0, -1);
  m2PaintCurrent();
}

function m2PaintCurrent() {
  m2Tiles(m2.row).forEach((t, i) => {
    t.textContent = m2.cur[i] || "";
    t.classList.toggle("filled", !!m2.cur[i]);
  });
}

function m2Shake() {
  const row = $("m2-grid").children[m2.row];
  row.classList.remove("shake");
  void row.offsetWidth;
  row.classList.add("shake");
}

function m2Submit() {
  if (m2.over || m2.busy) return;
  if (m2.cur.length < m2.word.length) {
    m2Shake();
    $("m2-msg").textContent = `Faltam ${m2.word.length - m2.cur.length} letra(s) para o disparo.`;
    return;
  }
  const guess = m2.cur;
  const result = evalGuess(guess, m2.word);
  const tiles = m2Tiles(m2.row);
  m2.busy = true;
  $("m2-msg").textContent = "";

  tiles.forEach((t, i) => {
    setTimeout(() => {
      t.classList.add("flip", result[i]);
    }, i * 160);
  });

  setTimeout(() => {
    // atualiza o teclado (crítico > ricochete > ausente)
    const rank = { miss: 1, bounce: 2, crit: 3 };
    [...guess].forEach((ch, i) => {
      if (!m2.keyState[ch] || rank[result[i]] > rank[m2.keyState[ch]]) m2.keyState[ch] = result[i];
    });
    document.querySelectorAll("#m2-keys .key").forEach((k) => {
      const st = m2.keyState[k.dataset.key];
      k.classList.remove("crit", "bounce", "miss");
      if (st) k.classList.add(st);
    });

    const won = guess === m2.word;
    m2.busy = false;
    if (won) return m2Finish(true);
    m2.row++;
    m2.cur = "";
    if (m2.row >= M2_TRIES) return m2Finish(false);

    m2UpdateShot();
    const crits = result.filter((r) => r === "crit").length;
    const bounces = result.filter((r) => r === "bounce").length;
    m2SetPose("miss", 1300);
    m2Say(`Disparo falhou: ${crits} crítico(s) e ${bounces} ricochete(s). Restam ${M2_TRIES - m2.row}. Qual é Dante, como você conseguiu pensar nessa senha?`);
  }, tiles.length * 160 + 350);
}

function m2Finish(won) {
  m2.over = true;
  const used = won ? m2.row + 1 : M2_TRIES;
  if (won) {
    m2.wins++; m2.streak++;
    m2SetPose("win", 0);
    const rank = used <= 2 ? "SSS" : used === 3 ? "SS" : used === 4 ? "S" : used === 5 ? "A" : "B";
    flashRank(rank, `RANK ${rank}!`);
    m2Say("Consegui! Hora de me juntar ao Dante.");
    $("m2-msg").textContent = `ACESSO LIBERADO em ${used} disparo(s). Rank ${rank}.`;
  } else {
    m2.losses++; m2.streak = 0;
    m2SetPose("miss", 0);
    m2Say("O sistema bloqueou o arsenal… O Dante vai pagar caro por colocar uma senha tão dificil.");
    $("m2-msg").textContent = `SISTEMA BLOQUEADO. A senha era: ${m2.word}.`;
  }
  m2.row = Math.min(m2.row, M2_TRIES - 1);
  m2UpdateShot();
  $("m2-new").textContent = "▶ PRÓXIMA SENHA";
  m2UpdateStats();
}

function m2UpdateStats() {
  $("m2-wins").textContent = m2.wins;
  $("m2-losses").textContent = m2.losses;
  $("m2-streak").textContent = m2.streak;
}

function initMode2() {
  $("m2-new").addEventListener("click", (e) => { m2NewRound(); e.currentTarget.blur(); });
  document.addEventListener("keydown", (e) => {
    if ($("game2").classList.contains("hidden")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Enter") { e.preventDefault(); m2Submit(); }
    else if (e.key === "Backspace") { e.preventDefault(); m2Back(); }
    else if (/^[a-zA-Z]$/.test(e.key)) m2Type(e.key.toUpperCase());
  });
}

/* =========================================================
   MODO 3 — Corte Dimensional (associação com tempo)
   ========================================================= */
const M3_GOAL = 10;   // acertos consecutivos para abrir o portal
const M3_TIME = 10;   // segundos por rodada
const M3_PENALTY = 2; // pontos perdidos na barra ao errar (ou esgotar o tempo)
const SECRET_PASSWORD = null; // placeholder: defina a senha real aqui depois

const M3_NAMES = {
  CPU: "CPU", ULA: "ULA", UC: "UC", REGISTRADORES: "Registradores", RAM: "RAM", ROM: "ROM",
  EEPROM: "EEPROM", FLASH: "Flash", CACHE: "Cache", MEMORIADEMASSA: "Memória de massa",
  DMA: "DMA", ADDRESSBUS: "Address bus", DATABUS: "Data bus",
  MICROCONTROLADOR: "Microcontrolador", DUALCORE: "Dual core", QUADCORE: "Quad core",
};

const m3 = {
  started: false, running: false, over: false, lock: false,
  streak: 0, left: M3_TIME, word: "", options: [], bag: [], poseTimer: null,
};

function m3Say(t) { $("m3-speech").textContent = t; }

function m3SetPose(pose, ms) {
  const img = $("hero3-main");
  const slot = img.closest(".slot");
  clearTimeout(m3.poseTimer);
  const key = pose === "cut" ? "rivalCut" : pose === "miss" ? "rivalMiss" : "rivalIdle";
  img.dataset.fallback = pose === "idle" ? "" : "rivalIdle";
  loadSprite(img, key);
  slot.classList.toggle("pose-win", pose === "cut");
  slot.classList.toggle("pose-miss", pose === "miss");
  if (ms) m3.poseTimer = setTimeout(() => m3SetPose("idle"), ms);
}

function normText(t) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function m3NextWord() {
  if (!m3.bag.length) {
    m3.bag = shuffle(WORDS.map((w) => w.word));
    // evita repetir a última palavra no início de um novo saco
    if (m3.bag[m3.bag.length - 1] === m3.word) m3.bag.unshift(m3.bag.pop());
  }
  return m3.bag.pop();
}

function m3Distractors(word, clue) {
  const clueN = normText(clue);
  const all = WORDS.map((w) => w.word).filter((w) => w !== word);
  // prefere distratores que não aparecem escritos na própria pista
  const fair = all.filter((w) => !new RegExp(`\\b${normText(M3_NAMES[w])}\\b`).test(clueN));
  return shuffle(fair.length >= 2 ? fair : all).slice(0, 2);
}

function m3BuildFocus() {
  const box = $("m3-focus");
  box.innerHTML = "";
  for (let i = 0; i < M3_GOAL; i++) {
    const seg = document.createElement("i");
    box.appendChild(seg);
  }
}

function m3UpdateHud() {
  [...$("m3-focus").children].forEach((seg, i) => seg.classList.toggle("on", i < m3.streak));
  $("m3-count").textContent = `${m3.streak} de ${M3_GOAL}`;
  const pct = Math.max(0, (m3.left / M3_TIME) * 100);
  const bar = $("m3-time-bar");
  bar.style.width = pct + "%";
  bar.classList.toggle("low", m3.left <= 3);
  $("m3-time").textContent = Math.max(0, m3.left).toFixed(1) + "s";
}

function m3Reset() {
  m3.started = true; m3.over = false; m3.streak = 0; m3.bag = []; m3.word = "";
  m3BuildFocus();
  m3NewRound();
}

function m3NewRound() {
  m3.word = m3NextWord();
  const clue = WORDS.find((w) => w.word === m3.word).clue;
  m3.options = shuffle([m3.word, ...m3Distractors(m3.word, clue)]);
  m3.left = M3_TIME; m3.lock = false; m3.running = true;

  $("m3-clue").textContent = clue;
  $("m3-msg").textContent = "";
  const box = $("m3-opts");
  box.innerHTML = "";
  m3.options.forEach((w, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "m3-opt";
    b.dataset.i = i;
    b.innerHTML = `<small>${i + 1}</small>${M3_NAMES[w]}`;
    b.addEventListener("click", () => { m3Answer(i); b.blur(); });
    box.appendChild(b);
  });
  m3SetPose("idle");
  m3UpdateHud();
}

function m3Answer(i) {
  if (m3.lock || !m3.running) return;
  m3.lock = true; m3.running = false;
  const right = m3.options.indexOf(m3.word);
  const hit = i === right;
  [...$("m3-opts").children].forEach((b, k) => {
    b.disabled = true;
    if (k === right) b.classList.add("right");
    else if (k === i) b.classList.add("wrong");
  });

  if (hit) {
    m3.streak++;
    m3SetPose("cut", 700);
    m3Say("Corte limpo, a Yamato nunca errou nenhum corte.");
    $("m3-msg").textContent = "CORTE PERFEITO!";
    m3UpdateHud();
    if (m3.streak >= M3_GOAL) return setTimeout(m3Win, 800);
    setTimeout(m3NewRound, 900);
  } else {
    m3.streak = Math.max(0, m3.streak - M3_PENALTY); // errar tira 2 pontos da barra
    m3SetPose("miss", 1300);
    m3Say(i === null ? "Dante... Você e o tempo sempre foram meus maiores inimigos... e eu irei superar ambos." : "Frequência errada. Droga, eu preciso de mais poder...");
    $("m3-msg").textContent =
      (i === null ? "TEMPO ESGOTADO. " : "ERROU. ") + `Era: ${M3_NAMES[m3.word]}. Concentração −${M3_PENALTY}.`;
    m3UpdateHud();
    setTimeout(m3NewRound, 1700);
  }
}

function m3Win() {
  m3.over = true; m3.running = false;
  m3SetPose("cut", 0);
  m3Say("O portal se abriu. Hora de sumir daqui.");
  $("victory3").classList.remove("hidden");
}

function goMode3() { showScreen(m3.started ? "game3" : "intro3"); }
function startMode3() {
  showScreen("game3");
  if (!m3.started || m3.over) m3Reset(); // senão, retoma a rodada em andamento
}

function initMode3() {
  $("mode-3").addEventListener("click", () => showScreen("intro3"));
  $("nav-m3").addEventListener("click", goMode3);
  $("btn-back3").addEventListener("click", () => showScreen("menu"));
  $("btn-start3").addEventListener("click", startMode3);
  $("btn-again3").addEventListener("click", () => { $("victory3").classList.add("hidden"); m3Reset(); });
  $("btn-menu3").addEventListener("click", () => { $("victory3").classList.add("hidden"); showScreen("menu"); });

  // cronômetro regressivo (só corre enquanto a tela do Modo 3 está visível)
  setInterval(() => {
    if (!m3.running || $("game3").classList.contains("hidden")) return;
    m3.left -= 0.1;
    if (m3.left <= 0) { m3.left = 0; m3UpdateHud(); m3Answer(null); return; }
    m3UpdateHud();
  }, 100);

  document.addEventListener("keydown", (e) => {
    if ($("game3").classList.contains("hidden")) return;
    if (["1", "2", "3"].includes(e.key)) m3Answer(Number(e.key) - 1);
  });

  // Modo Secreto (placeholder)
  $("mode-secret").addEventListener("click", () => {
    $("secret-msg").textContent = "";
    $("secret-input").value = "";
    showScreen("secret");
  });
  $("btn-back-secret").addEventListener("click", () => showScreen("menu"));
  $("secret-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const typed = normText($("secret-input").value.trim());
    if (SECRET_PASSWORD === null) {
      $("secret-msg").textContent = "O modo secreto ainda está em construção.";
    } else if (typed === normText(SECRET_PASSWORD)) {
      $("secret-msg").textContent = "ACESSO LIBERADO.";
    } else {
      $("secret-msg").textContent = "SENHA INCORRETA.";
    }
  });
}
