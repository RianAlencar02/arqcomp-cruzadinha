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

// ---------- Sprites originais em pixel art ----------
const PALETTE = {
  k: "#0a0610", h: "#4b1f7a", H: "#7a3fb8", v: "#3fe0d0", s: "#e2b48c",
  b: "#d9fbff", g: "#8a8fa8", r: "#e0113a", R: "#b3123a", y: "#f2c14e",
  G: "#14513a", o: "#ff8a1f", O: "#b34d00",
};
const HERO = [
  "....kkkkkk......",
  "...khhhhhhk.....",
  "..khhHHHHhhk....",
  "..khkvvvvkhk....",
  "..khkvvvvkhk..b.",
  "..khhkkkkhhk.bb.",
  "...kkhhhhkk.bb..",
  "..khhhrrhhhkbbg.",
  ".khhhhrrhhhgk...",
  ".khshhrrhhhgk...",
  ".khhhhrrhhhkk...",
  "..khhhhhhhhk....",
  "..khhhhhhhhk....",
  "..kkhhkkhhkk....",
  "..kkkkkkkkkk....",
  "..kkk.kk.kkk....",
];
const HERO_WIN = [
  "y.s.kkkkkk.s.y..",
  "..hkhhhhhhkh....",
  "..hkhHHHHhkh....",
  "...khkvvvvkhk...",
  "...khkvvvvkhk...",
  "....khkkkkhk....",
  "...khhhhhhhhk...",
  "..khhhhrrhhhhk..",
  "..khhhhrrhhhhk..",
  "...khhhrrhhhk...",
  "...khhhrrhhhk...",
  "...khhhhhhhhk...",
  "...kkhhhhhhkk...",
  "...kkhhkkhhkk...",
  "...kkk.kk.kkk...",
  "...kkk.kk.kkk...",
];
const HERO_THINK = [
  "....kkkkkk..yyy.",
  "...khhhhhhk...y.",
  "..khhHHHHhhk.yy.",
  "..khkvvvvkhk.y..",
  "..khkvvvvkhk.y..",
  "..khhkkkkhhk....",
  "...kkhhhhkk.y...",
  "..khhhrrhhhk....",
  ".khhhhrrhhhhk...",
  ".khhhhrrhsskk...",
  ".khhhhrrhsk.....",
  "..khhhhhhhhk....",
  "..khhhhhhhhk....",
  "..kkhhkkhhkk....",
  "..kkkkkkkkkk....",
  "..kkk.kk.kkk....",
];
// Rival original: capuz verde-escuro, visor âmbar e lâmina laranja
const RIVAL = [
  "....kkkkkk......",
  "...kGGGGGGk.....",
  "..kGGGGGGGGk....",
  "..kGkooookGk....",
  "..kGkooookGk....",
  "..kGGkkkkGGk....",
  "...kkGGGGkk.....",
  "..kGGGyyGGGk....",
  "okGGGGyyGGGGk...",
  "okGGGGyyGGGGk...",
  "OkGGGGyyGGGGk...",
  "gkGGGGGGGGGGk...",
  ".kkGGGGGGGGkk...",
  "..kGGkkkkGGk....",
  "..kkk.kk.kkk....",
  "..kkk.kk.kkk....",
];

function drawSprite(canvas, map, scale) {
  const ctx = canvas.getContext("2d");
  canvas.width = 16 * scale;
  canvas.height = 16 * scale;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  map.forEach((line, y) => {
    for (let x = 0; x < 16; x++) {
      const ch = line[x];
      if (ch && ch !== "." && PALETTE[ch]) {
        ctx.fillStyle = PALETTE[ch];
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  });
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
    say("Barreira rompida! Rank SSS no estilo!");
    showVictory();
  } else {
    say(`${ok} certas, ${wrong} erradas, ${pending} incompletas. Siga em frente!`);
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
  say("Dica estilosa! Uma letra do código foi revelada.");
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
  say("Palavra revelada. Nem todo caçador vence sozinho.");
}

function reiniciar() {
  cells.forEach((cell) => { cell.input.value = ""; clearMarks(cell); });
  WORDS.forEach((w) => w.li.classList.remove("ok", "bad"));
  hints = 0; reveals = 0; checked = false; lastOk = 0;
  setPose("idle");
  $("status").textContent = `0 de ${WORDS.length} palavras`;
  $("victory").classList.add("hidden");
  updateCounters();
  say("O tabuleiro foi limpo. Recomeçar é parte da caçada!");
  selectWord(0, true);
}

function updateCounters() {
  $("hints").textContent = hints;
  $("reveals").textContent = reveals;
}

function say(text) { $("speech").textContent = text; }

function setPose(pose, ms) {
  const c = $("hero-main");
  if (!c) return;
  clearTimeout(poseTimer);
  const map = pose === "win" ? HERO_WIN : pose === "think" ? HERO_THINK : HERO;
  drawSprite(c, map, 6);
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
  "Vex bloqueou o firewall principal com uma criptografia antiga baseada em arquitetura de computadores. " +
  "Antes de sacar a lâmina, o Caçador precisa decifrar os termos técnicos deixados por seu irmão para " +
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

function showScreen(name) {
  ["menu", "intro", "game"].forEach((id) => $(id).classList.toggle("hidden", id !== name));
  $("mode-label").textContent =
    name === "menu" ? "ESCOLHA SEU MODO" : "MODO 1 · CRUZADINHA DO CAÇADOR";
}

function startGame() {
  showScreen("game");
  typeContext(CONTEXT);
  selectWord(0, true);
}

function init() {
  numberWords();
  buildBoard();
  buildClues();
  onBoardEvents();
  document.querySelectorAll("canvas.hero").forEach((c) => drawSprite(c, HERO, Number(c.dataset.scale) || 6));
  document.querySelectorAll("canvas.rival").forEach((c) => drawSprite(c, RIVAL, Number(c.dataset.scale) || 6));
  drawSprite($("hero-win"), HERO_WIN, 8);
  drawBackground();
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
