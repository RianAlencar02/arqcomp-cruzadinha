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
const IMP = [
  "................",
  ".k..........k...",
  ".rk........kr...",
  "..rkkkkkkkkr....",
  "...kRRRRRRk.....",
  "...kRyRRyRk.....",
  "...kRRRRRRk.....",
  "...kRkkkkRk.....",
  "....kRRRRk......",
  "...kkRRRRkk.....",
  "..kRRRRRRRRk....",
  "..kRkRRRRkRk....",
  "..kk.kRRk.kk....",
  "......kRRk......",
  ".....kkkkkk.....",
  "................",
];

function drawSprite(canvas, map, scale) {
  const ctx = canvas.getContext("2d");
  canvas.width = 16 * scale;
  canvas.height = 16 * scale;
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
  if (ok === WORDS.length) {
    say("Todos os portões foram selados!");
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
  say("Uma runa se revelou…");
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
  hints = 0; reveals = 0; checked = false;
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

function showVictory() {
  $("victory-text").textContent =
    `Você selou os ${WORDS.length} portões usando ${hints} dica(s) e ${reveals} resposta(s) reveladas.`;
  $("victory").classList.remove("hidden");
}

// ---------- Início ----------
function startGame() {
  $("intro").classList.add("hidden");
  $("game").classList.remove("hidden");
  selectWord(0, true);
}

function init() {
  numberWords();
  buildBoard();
  buildClues();
  onBoardEvents();
  document.querySelectorAll("canvas.hero").forEach((c) => drawSprite(c, HERO, Number(c.dataset.scale) || 6));
  document.querySelectorAll("canvas.imp").forEach((c) => drawSprite(c, IMP, Number(c.dataset.scale) || 6));
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
