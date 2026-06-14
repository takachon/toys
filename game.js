/* みんなのキッズゲーム
 * 年齢別に遊べる子供向けミニゲーム集（依存ライブラリなし）
 */
(function () {
  "use strict";

  // ---- 共通ユーティリティ ----
  const $ = (id) => document.getElementById(id);
  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rand(arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  let score = 0;
  let activeTimers = [];

  function setScore(v) {
    score = v;
    $("score").textContent = score;
  }
  function addScore(v) {
    setScore(score + v);
  }
  function clearTimers() {
    activeTimers.forEach((t) => clearTimeout(t) || clearInterval(t));
    activeTimers = [];
  }
  function later(fn, ms) {
    const t = setTimeout(fn, ms);
    activeTimers.push(t);
    return t;
  }
  function every(fn, ms) {
    const t = setInterval(fn, ms);
    activeTimers.push(t);
    return t;
  }

  // ---- 画面遷移 ----
  function showPage(pageId, showScore) {
    clearTimers();
    ["homeScreen", "ageScreen", "menuScreen", "gameScreen"].forEach((p) =>
      $(p).classList.add("hidden")
    );
    $(pageId).classList.remove("hidden");
    $("topbar").classList.toggle("hidden", pageId === "homeScreen");
    $("scoreBox").classList.toggle("hidden", !showScore);
  }

  // ====================================================
  // ゲーム実装
  // それぞれ render(area, msg) を持つ
  // ====================================================

  function setMsg(text, type) {
    const m = $("gameMessage");
    m.textContent = text || "";
    m.className = "game-message" + (type ? " " + type : "");
  }

  // --- 1. どうぶつタップ（3〜4さい）---
  function gameTapAnimal(area) {
    const animals = ["🐶", "🐱", "🐰", "🐸", "🐤", "🐮", "🐷", "🦁", "🐵", "🐧"];
    area.innerHTML = '<div class="tap-stage" id="tapStage"></div>';
    const stage = $("tapStage");
    setMsg("どうぶつを タップしてね！", "good");

    function spawn() {
      const el = document.createElement("div");
      el.className = "tap-target";
      el.textContent = pick(animals);
      el.style.left = rand(80) + "%";
      el.style.top = rand(75) + "%";
      el.addEventListener("click", () => {
        addScore(1);
        el.textContent = "⭐";
        setMsg("やったー！ " + pick(["すごい！", "じょうず！", "イェイ！"]), "good");
        later(() => el.remove(), 250);
      });
      stage.appendChild(el);
      later(() => el.remove(), 2200);
    }
    spawn();
    every(spawn, 1100);
  }

  // --- 2. いろあわせ（3〜4さい）---
  function gameColorMatch(area) {
    const colors = [
      { name: "あか", c: "#ff6b6b" },
      { name: "あお", c: "#4d96ff" },
      { name: "きいろ", c: "#ffd93d" },
      { name: "みどり", c: "#6bcb77" },
    ];
    function round() {
      const target = pick(colors);
      const opts = shuffle(colors);
      area.innerHTML =
        '<div class="question">「' +
        target.name +
        '」は どれ？</div><div class="choices" id="ch"></div>';
      const ch = $("ch");
      opts.forEach((o) => {
        const b = document.createElement("button");
        b.className = "choice-btn";
        b.style.background = o.c;
        b.textContent = "　";
        b.addEventListener("click", () => {
          if (o.name === target.name) {
            addScore(1);
            setMsg("せいかい！ 🎉", "good");
            later(round, 900);
          } else {
            setMsg("ちがうよ、もういちど！", "bad");
          }
        });
        ch.appendChild(b);
      });
    }
    round();
  }

  // --- A. タッチであそぼ（1〜2さい）---
  // どこをタッチしても、たのしい絵がポンとでる
  function gameBabyTouch(area) {
    const fun = ["⭐", "🌈", "🎈", "🌸", "🍭", "🐤", "🦋", "🎵", "💖", "🍓", "🌟", "🐻"];
    area.innerHTML =
      '<div class="tap-stage" id="babyStage"><span class="tap-hint">がめんを タッチしてね 👆</span></div>';
    const stage = $("babyStage");
    setMsg("タッチ してね！", "good");

    function burst(x, y) {
      addScore(1);
      const hint = stage.querySelector(".tap-hint");
      if (hint) hint.remove();
      const el = document.createElement("div");
      el.className = "tap-target pop";
      el.textContent = pick(fun);
      // ステージ内の相対座標に変換
      const r = stage.getBoundingClientRect();
      el.style.left = Math.max(0, Math.min(85, ((x - r.left) / r.width) * 100)) + "%";
      el.style.top = Math.max(0, Math.min(80, ((y - r.top) / r.height) * 100)) + "%";
      stage.appendChild(el);
      setMsg(pick(["わーい！", "ポーン！", "すごい！", "イェイ！"]), "good");
      later(() => el.remove(), 900);
    }
    stage.addEventListener("pointerdown", (e) => burst(e.clientX, e.clientY));
  }

  // --- B. ぽんぽんバルーン（1〜2さい）---
  // でてくるふうせんをタッチでパチン
  function gameBalloon(area) {
    const balloons = ["🎈", "🟡", "🔴", "🔵", "🟢", "🟣"];
    area.innerHTML = '<div class="tap-stage" id="balloonStage"></div>';
    const stage = $("balloonStage");
    setMsg("ふうせんを パチン！", "good");

    function spawn() {
      const el = document.createElement("div");
      el.className = "tap-target float";
      el.textContent = pick(balloons);
      el.style.left = rand(80) + "%";
      el.style.top = 70 + rand(20) + "%";
      el.addEventListener("pointerdown", () => {
        addScore(1);
        el.textContent = "✨";
        el.classList.add("pop");
        setMsg(pick(["パチン！", "やったー！", "ぱちぱち！"]), "good");
        later(() => el.remove(), 250);
      });
      stage.appendChild(el);
      later(() => el.remove(), 3000);
    }
    spawn();
    every(spawn, 1300);
  }

  // --- C. どうぶつタッチ（2〜3さい）---
  // おおきなどうぶつをタッチすると、つぎのばしょへ
  function gameBigTap(area) {
    const animals = ["🐶", "🐱", "🐰", "🐻", "🐼", "🐸", "🐤", "🦁", "🐮", "🐷", "🐵", "🦒"];
    area.innerHTML = '<div class="tap-stage" id="bigStage"></div>';
    const stage = $("bigStage");
    setMsg("どうぶつを タッチ！", "good");

    function place() {
      stage.innerHTML = "";
      const el = document.createElement("div");
      el.className = "tap-target huge";
      el.textContent = pick(animals);
      el.style.left = rand(60) + "%";
      el.style.top = rand(55) + "%";
      el.addEventListener("pointerdown", () => {
        addScore(1);
        setMsg(pick(["やったー！", "じょうず！", "つかまえた！", "イェイ！"]), "good");
        place();
      });
      stage.appendChild(el);
    }
    place();
  }

  // --- D. おおきいの どっち？（2〜3さい）---
  function gameBigSmall(area) {
    const things = ["🍎", "🐶", "⭐", "🎈", "🚗", "🌸", "🐟", "🍓"];
    function round() {
      const thing = pick(things);
      const bigFirst = Math.random() < 0.5;
      area.innerHTML =
        '<div class="question">おおきいのは どっち？</div>' +
        '<div class="choices two" id="ch"></div>';
      const ch = $("ch");
      [bigFirst, !bigFirst].forEach((isBig) => {
        const b = document.createElement("button");
        b.className = "choice-btn light";
        b.style.fontSize = isBig ? "3.6rem" : "1.6rem";
        b.textContent = thing;
        b.addEventListener("click", () => {
          if (isBig) {
            addScore(1);
            setMsg("せいかい！ 🎉", "good");
            later(round, 900);
          } else {
            setMsg("こっちは ちいさいよ！", "bad");
          }
        });
        ch.appendChild(b);
      });
    }
    round();
  }

  // --- 3. かずをかぞえよう（5〜6さい）---
  function gameCount(area) {
    const things = ["🍎", "🍓", "🐟", "⭐", "🌸", "🚗", "🎈", "🍪"];
    function round() {
      const n = 1 + rand(9);
      const thing = pick(things);
      const correct = n;
      const opts = shuffle(uniqueNums(correct, 3, 1, 9));
      area.innerHTML =
        '<div class="big-emojis">' +
        thing.repeat(n) +
        '</div><div class="question">いくつ あるかな？</div><div class="choices" id="ch"></div>';
      buildNumChoices($("ch"), opts, correct, round);
    }
    round();
  }

  // --- 4. かたちあわせ（5〜6さい）---
  function gameShape(area) {
    const shapes = [
      { e: "🔺", n: "さんかく" },
      { e: "⬜", n: "しかく" },
      { e: "⭕", n: "まる" },
      { e: "⭐", n: "ほし" },
      { e: "💛", n: "はーと" },
    ];
    function round() {
      const target = pick(shapes);
      const opts = shuffle(shapes).slice(0, 3);
      if (!opts.includes(target)) opts[0] = target;
      const shown = shuffle(opts);
      area.innerHTML =
        '<div class="question">「' +
        target.n +
        '」を さがそう</div><div class="choices" id="ch"></div>';
      const ch = $("ch");
      shown.forEach((o) => {
        const b = document.createElement("button");
        b.className = "choice-btn";
        b.textContent = o.e;
        b.addEventListener("click", () => {
          if (o.n === target.n) {
            addScore(1);
            setMsg("せいかい！ ✨", "good");
            later(round, 900);
          } else {
            setMsg("ちがうみたい！", "bad");
          }
        });
        ch.appendChild(b);
      });
    }
    round();
  }

  // --- 5. けいさんチャレンジ（7〜9さい）---
  function gameMath(area) {
    function round() {
      const op = pick(["+", "-"]);
      let a = 1 + rand(20);
      let b = 1 + rand(20);
      if (op === "-" && b > a) [a, b] = [b, a];
      const correct = op === "+" ? a + b : a - b;
      const opts = shuffle(uniqueNums(correct, 3, 0, 40));
      area.innerHTML =
        '<div class="question">' +
        a +
        " " +
        op +
        " " +
        b +
        ' = ?</div><div class="choices" id="ch"></div>';
      buildNumChoices($("ch"), opts, correct, round);
    }
    round();
  }

  // --- 6. きおくゲーム（7〜9さい）神経衰弱 ---
  function gameMemory(area) {
    const faces = ["🐶", "🐱", "🐰", "🐸", "🐤", "🦁"];
    const deck = shuffle(faces.concat(faces));
    let first = null;
    let lock = false;
    let matched = 0;
    setMsg("おなじ どうぶつを みつけてね", "good");
    area.innerHTML = '<div class="memory-grid" id="mg"></div>';
    const mg = $("mg");
    deck.forEach((face) => {
      const card = document.createElement("div");
      card.className = "memory-card";
      card.dataset.face = face;
      card.textContent = "?";
      card.addEventListener("click", () => {
        if (lock || card.classList.contains("flipped") || card.classList.contains("matched"))
          return;
        card.classList.add("flipped");
        card.textContent = face;
        if (!first) {
          first = card;
          return;
        }
        if (first.dataset.face === face) {
          first.classList.add("matched");
          card.classList.add("matched");
          addScore(2);
          matched += 2;
          first = null;
          if (matched === deck.length) {
            setMsg("ぜんぶ そろった！ 🏆", "good");
          }
        } else {
          lock = true;
          const f = first;
          later(() => {
            f.classList.remove("flipped");
            f.textContent = "?";
            card.classList.remove("flipped");
            card.textContent = "?";
            first = null;
            lock = false;
          }, 700);
        }
      });
      mg.appendChild(card);
    });
  }

  // --- 7. もぐらたたき（10さい〜）反射神経 ---
  function gameMole(area) {
    area.innerHTML =
      '<div class="timer" id="moleTimer">のこり 30びょう</div>' +
      '<div class="mole-grid" id="moleGrid"></div>';
    const grid = $("moleGrid");
    const holes = [];
    for (let i = 0; i < 9; i++) {
      const h = document.createElement("div");
      h.className = "mole-hole";
      h.textContent = "";
      h.addEventListener("click", () => {
        if (h.classList.contains("up")) {
          addScore(1);
          h.classList.remove("up");
          h.textContent = "💥";
          later(() => (h.textContent = ""), 150);
        }
      });
      grid.appendChild(h);
      holes.push(h);
    }
    setMsg("もぐらを たたこう！", "good");

    let timeLeft = 30;
    every(() => {
      timeLeft--;
      $("moleTimer").textContent = "のこり " + timeLeft + "びょう";
      if (timeLeft <= 0) {
        clearTimers();
        setMsg("おしまい！ スコア " + score, "good");
        holes.forEach((h) => {
          h.classList.remove("up");
          h.textContent = "";
        });
      }
    }, 1000);

    every(() => {
      holes.forEach((h) => {
        h.classList.remove("up");
        h.textContent = "";
      });
      const up = pick(holes);
      up.classList.add("up");
      up.textContent = "🐹";
    }, 800);
  }

  // --- 8. けいさんスピード（10さい〜）かけ算 ---
  function gameMulti(area) {
    function round() {
      const a = 2 + rand(8);
      const b = 2 + rand(8);
      const correct = a * b;
      const opts = shuffle(uniqueNums(correct, 3, 4, 81));
      area.innerHTML =
        '<div class="question">' +
        a +
        " × " +
        b +
        ' = ?</div><div class="choices" id="ch"></div>';
      buildNumChoices($("ch"), opts, correct, round);
    }
    round();
  }

  // --- 9. ピアノタイル（10さい〜）反射神経 ---
  // 上から落ちてくる黒いタイルを、下に着くまえにタップ！
  function gamePianoTiles(area) {
    const COLS = 4;
    const BOARD_H = 420; // CSS の .piano-board と一致
    const TILE_H = 105; // 画面に約4列ぶん
    area.innerHTML =
      '<div class="piano-board" id="pboard">' +
      '<div class="piano-overlay" id="poverlay">' +
      '<div class="piano-lead">くろいタイルを<br>タップ！</div>' +
      '<button class="start-btn" id="pstart">▶ スタート</button>' +
      "</div></div>";
    const board = $("pboard");

    let rows = [];
    let speed = 2.2;
    let playing = false;

    function spawnRow(y) {
      const col = rand(COLS);
      const el = document.createElement("div");
      el.className = "piano-tile";
      el.style.left = col * (100 / COLS) + "%";
      el.style.top = y + "px";
      const row = { y: y, el: el, tapped: false };
      el.addEventListener("pointerdown", function (e) {
        e.stopPropagation();
        tap(row);
      });
      board.appendChild(el);
      rows.push(row);
    }

    function tap(row) {
      if (!playing || row.tapped) return;
      row.tapped = true;
      addScore(1);
      row.el.classList.add("hit");
      rows = rows.filter(function (r) {
        return r !== row;
      });
      speed += 0.05; // タップするほど少しずつ速く
      later(function () {
        if (row.el.parentNode) row.el.remove();
      }, 120);
    }

    function tick() {
      speed += 0.004; // じわじわ加速
      let missed = false;
      rows.forEach(function (r) {
        r.y += speed;
        r.el.style.top = r.y + "px";
        if (r.y > BOARD_H && !r.tapped) missed = true;
      });
      if (missed) {
        gameOver();
        return;
      }
      const top = rows.length
        ? Math.min.apply(
            null,
            rows.map(function (r) {
              return r.y;
            })
          )
        : BOARD_H;
      if (top >= 0) spawnRow(top - TILE_H);
    }

    function gameOver() {
      playing = false;
      clearTimers();
      setMsg("おしまい！ スコア " + score, "good");
      const ov = document.createElement("div");
      ov.className = "piano-overlay";
      ov.id = "poverlay";
      ov.innerHTML =
        '<div class="piano-score">スコア ' +
        score +
        "</div>" +
        '<button class="start-btn" id="pstart">もういちど</button>';
      board.appendChild(ov);
      ov.querySelector("#pstart").addEventListener("click", start);
    }

    function start() {
      rows.forEach(function (r) {
        if (r.el.parentNode) r.el.remove();
      });
      rows = [];
      board.innerHTML = "";
      speed = 2.2;
      playing = true;
      setScore(0);
      setMsg("くろいタイルを タップ！", "good");
      // したから うえへ タイルをならべる
      for (let y = BOARD_H - TILE_H; y > -TILE_H; y -= TILE_H) spawnRow(y);
      every(tick, 25);
    }

    $("pstart").addEventListener("click", start);
  }

  // ---- 数字選択肢の共通ビルダー ----
  function uniqueNums(correct, count, min, max) {    const set = new Set([correct]);
    let guard = 0;
    while (set.size < count && guard++ < 200) {
      const delta = 1 + rand(5);
      const cand = Math.random() < 0.5 ? correct + delta : correct - delta;
      if (cand >= min && cand <= max) set.add(cand);
    }
    while (set.size < count) set.add(min + set.size);
    return Array.from(set);
  }

  function buildNumChoices(ch, opts, correct, next) {
    opts.forEach((o) => {
      const b = document.createElement("button");
      b.className = "choice-btn";
      b.textContent = o;
      b.addEventListener("click", () => {
        if (o === correct) {
          b.classList.add("correct");
          addScore(1);
          setMsg("せいかい！ ⭕", "good");
          later(next, 800);
        } else {
          b.classList.add("wrong");
          setMsg("おしい！ もういちど", "bad");
        }
      });
      ch.appendChild(b);
    });
  }

  // ====================================================
  // スペシャル：つむフレンズ（ツムツム風 なぞりつなぎパズル）
  // ====================================================
  function gameTumFriends(area) {
    const TYPES = ["🐻", "🐰", "🐱", "🐸", "🐤", "🐵"];
    const RB = -1; // にじいろ（ワイルド）
    const COLS = 6,
      ROWS = 7;
    let grid = [],
      tileEls = [],
      chain = [],
      chainType = null,
      dragging = false,
      over = false,
      time = 60;

    area.innerHTML =
      '<div class="tum-info"><span id="tumTimer">⏱ 60</span><span class="tum-hint">おなじ なかまを なぞって 3こ いじょう つなげよう！🌈は どれにでも つながるよ</span></div>' +
      '<div class="tum-grid" id="tumGrid"></div>' +
      '<button class="start-btn hidden" id="tumRetry">もういちど</button>';
    const gridEl = $("tumGrid");

    function randTile() {
      return Math.random() < 0.04 ? RB : rand(TYPES.length);
    }
    function tileEmoji(v) {
      return v === RB ? "🌈" : TYPES[v];
    }
    // 初期化
    for (let r = 0; r < ROWS; r++) {
      grid[r] = [];
      for (let c = 0; c < COLS; c++) grid[r][c] = rand(TYPES.length);
    }
    render();
    setMsg("なぞって つなげてね！", "good");

    let timer = every(() => {
      time--;
      $("tumTimer").textContent = "⏱ " + time;
      if (time <= 0) finish();
    }, 1000);

    function render() {
      gridEl.innerHTML = "";
      tileEls = [];
      for (let r = 0; r < ROWS; r++) {
        tileEls[r] = [];
        for (let c = 0; c < COLS; c++) {
          const el = document.createElement("div");
          el.className = "tum";
          el.dataset.r = r;
          el.dataset.c = c;
          el.textContent = tileEmoji(grid[r][c]);
          if (grid[r][c] === RB) el.classList.add("rb");
          gridEl.appendChild(el);
          tileEls[r][c] = el;
        }
      }
    }
    function cellFromPoint(x, y) {
      const el = document.elementFromPoint(x, y);
      if (!el) return null;
      const t = el.closest && el.closest(".tum");
      if (!t) return null;
      return { r: +t.dataset.r, c: +t.dataset.c };
    }
    function inChain(cell) {
      return chain.some((p) => p.r === cell.r && p.c === cell.c);
    }
    function adjacent(a, b) {
      const dr = Math.abs(a.r - b.r),
        dc = Math.abs(a.c - b.c);
      return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
    }
    function recomputeType() {
      chainType = null;
      for (const p of chain) {
        const v = grid[p.r][p.c];
        if (v !== RB) {
          chainType = v;
          break;
        }
      }
    }
    function typeOK(cell) {
      const v = grid[cell.r][cell.c];
      return v === RB || chainType === null || v === chainType;
    }
    function paint() {
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) tileEls[r][c].classList.remove("sel");
      chain.forEach((p) => tileEls[p.r][p.c].classList.add("sel"));
      setMsg(chain.length > 1 ? "つなげて " + chain.length + " こ 🔗" : "なぞって つなげてね！", "good");
    }
    function extend(cell) {
      if (chain.length >= 2) {
        const prev = chain[chain.length - 2];
        if (prev.r === cell.r && prev.c === cell.c) {
          chain.pop();
          recomputeType();
          paint();
          return;
        }
      }
      if (inChain(cell)) return;
      if (!adjacent(chain[chain.length - 1], cell)) return;
      if (!typeOK(cell)) return;
      chain.push(cell);
      recomputeType();
      paint();
    }
    function collapse() {
      for (let c = 0; c < COLS; c++) {
        const col = [];
        for (let r = ROWS - 1; r >= 0; r--) if (grid[r][c] != null) col.push(grid[r][c]);
        for (let r = ROWS - 1, i = 0; r >= 0; r--, i++)
          grid[r][c] = i < col.length ? col[i] : randTile();
      }
    }
    function sprinkleRainbow() {
      grid[rand(ROWS)][rand(COLS)] = RB;
    }
    function resolve() {
      if (chain.length >= 3) {
        const len = chain.length;
        chain.forEach((p) => (grid[p.r][p.c] = null));
        const gained = len * 10 + (len >= 5 ? 50 : 0) + (len >= 7 ? 100 : 0);
        addScore(gained);
        setMsg(
          len >= 7 ? "スーパーコンボ！ 🌈 +" + gained : len >= 5 ? "コンボ！ ✨ +" + gained : "ナイス！ +" + gained,
          "good"
        );
        collapse();
        if (len >= 5) sprinkleRainbow();
      } else {
        setMsg("3こ いじょう つなげてね", "");
      }
      chain = [];
      chainType = null;
      render();
    }
    function finish() {
      over = true;
      clearTimers();
      setMsg("おしまい！ スコア " + score + " 🎉", "good");
      const btn = $("tumRetry");
      btn.classList.remove("hidden");
      btn.addEventListener("click", () => {
        setScore(0);
        gameTumFriends(area);
      });
    }

    gridEl.addEventListener("pointerdown", (e) => {
      if (over) return;
      const cell = cellFromPoint(e.clientX, e.clientY);
      if (!cell) return;
      e.preventDefault();
      try {
        gridEl.setPointerCapture(e.pointerId);
      } catch (_) {}
      dragging = true;
      chain = [cell];
      recomputeType();
      paint();
    });
    gridEl.addEventListener("pointermove", (e) => {
      if (!dragging || over) return;
      const cell = cellFromPoint(e.clientX, e.clientY);
      if (cell) extend(cell);
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      resolve();
    }
    gridEl.addEventListener("pointerup", endDrag);
    gridEl.addEventListener("pointercancel", endDrag);
  }

  const SPECIAL_GAMES = {
    label: "スペシャル",
    emoji: "✨",
    games: [{ title: "つむフレンズ", emoji: "🧩", run: gameTumFriends }],
  };

  // ====================================================
  // トランプゲーム（1人でCPUとあそぶ）
  // ====================================================
  const SUITS = [
    { s: "♠", red: false },
    { s: "♥", red: true },
    { s: "♦", red: true },
    { s: "♣", red: false },
  ];
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  function makeDeck() {
    const d = [];
    for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) d.push({ suit: s, rank: r });
    return d;
  }
  function rankStr(r) {
    return RANKS[r - 1];
  }
  function isRed(c) {
    return !c.joker && SUITS[c.suit].red;
  }
  function cardInner(c) {
    if (c.joker) return '<span class="cr">JK</span><span class="cs">🤡</span>';
    return (
      '<span class="cr">' + rankStr(c.rank) + '</span><span class="cs">' + SUITS[c.suit].s + "</span>"
    );
  }
  function cardEl(card, faceUp) {
    const el = document.createElement("div");
    if (faceUp) {
      el.className = "card up" + (isRed(card) ? " red" : "");
      el.innerHTML = cardInner(card);
    } else {
      el.className = "card back";
    }
    return el;
  }
  function sortHand(arr) {
    return arr.slice().sort((a, b) => {
      if (a.joker) return 1;
      if (b.joker) return -1;
      if (a.suit !== b.suit) return a.suit - b.suit;
      return a.rank - b.rank;
    });
  }
  function status(html) {
    const el = document.getElementById("cstatus");
    if (el) el.innerHTML = html;
  }

  // --- しんけいすいじゃく（神経衰弱）vs CPU ---
  function gameMemoryCards(area) {
    const base = shuffle(makeDeck()).slice(0, 8); // 8しゅるい
    const deck = shuffle(
      base.concat(base.map((c) => ({ suit: c.suit, rank: c.rank }))) // 各2まい
    );
    const cards = [];
    let firstIdx = null,
      lock = false,
      turn = "you",
      youPairs = 0,
      cpuPairs = 0,
      matched = 0;
    const seen = {}; // CPUの きおく： key -> Set(index)

    area.innerHTML =
      '<div class="card-status" id="cstatus"></div>' +
      '<div class="card-grid-4" id="mg"></div>';
    const mg = $("mg");
    deck.forEach((card, i) => {
      const el = document.createElement("div");
      el.className = "card back mcard";
      el.addEventListener("click", () => playerPick(i));
      mg.appendChild(el);
      cards.push({ card: card, el: el, matched: false });
    });
    update();
    setMsg("カードを 2まい めくってね", "good");

    function key(c) {
      return c.suit + "-" + c.rank;
    }
    function update() {
      status("あなた <b>" + youPairs + "</b> ペア　VS　CPU <b>" + cpuPairs + "</b> ペア");
    }
    function remember(i) {
      const k = key(cards[i].card);
      (seen[k] = seen[k] || new Set()).add(i);
    }
    function faceUp(i) {
      const c = cards[i];
      c.el.className = "card up mcard" + (isRed(c.card) ? " red" : "");
      c.el.innerHTML = cardInner(c.card);
      remember(i);
    }
    function faceDown(i) {
      const c = cards[i];
      if (c.matched) return;
      c.el.className = "card back mcard";
      c.el.innerHTML = "";
    }
    function playerPick(i) {
      if (turn !== "you" || lock) return;
      const c = cards[i];
      if (c.matched || c.el.classList.contains("up")) return;
      faceUp(i);
      if (firstIdx === null) {
        firstIdx = i;
        return;
      }
      evaluate(firstIdx, i, "you");
    }
    function evaluate(a, b, who) {
      lock = true;
      const ca = cards[a].card,
        cb = cards[b].card;
      const isMatch = ca.suit === cb.suit && ca.rank === cb.rank;
      later(
        () => {
          if (isMatch) {
            cards[a].matched = cards[b].matched = true;
            cards[a].el.classList.add("matched");
            cards[b].el.classList.add("matched");
            matched += 2;
            if (who === "you") youPairs++;
            else cpuPairs++;
            update();
            firstIdx = null;
            lock = false;
            if (matched === cards.length) return finish();
            if (who === "you") setMsg("そろった！ もう1かい！", "good");
            else cpuTurn();
          } else {
            faceDown(a);
            faceDown(b);
            firstIdx = null;
            lock = false;
            turn = who === "you" ? "cpu" : "you";
            if (turn === "cpu") cpuTurn();
            else setMsg("あなたの ばん！", "good");
          }
        },
        isMatch ? 500 : 850
      );
    }
    function cpuChoose() {
      const avail = cards.map((c, i) => i).filter((i) => !cards[i].matched);
      for (const k in seen) {
        const idxs = [...seen[k]].filter((i) => !cards[i].matched);
        if (idxs.length >= 2 && Math.random() < 0.85) return [idxs[0], idxs[1]];
      }
      const first = pick(avail);
      const known = [...(seen[key(cards[first].card)] || [])].filter(
        (i) => !cards[i].matched && i !== first
      );
      let second;
      if (known.length && Math.random() < 0.85) second = known[0];
      else second = pick(avail.filter((i) => i !== first));
      return [first, second];
    }
    function cpuTurn() {
      turn = "cpu";
      lock = true;
      setMsg("CPUの ばん…", "");
      later(() => {
        const [a, b] = cpuChoose();
        faceUp(a);
        later(() => {
          faceUp(b);
          evaluate(a, b, "cpu");
        }, 650);
      }, 650);
    }
    function finish() {
      const msg =
        youPairs > cpuPairs
          ? "あなたの かち！ 🏆"
          : youPairs < cpuPairs
          ? "CPUの かち！ つぎは がんばろう"
          : "ひきわけ！ 🤝";
      setMsg(msg, youPairs >= cpuPairs ? "good" : "bad");
    }
  }

  // --- ババぬき（Old Maid）vs CPU ---
  function gameOldMaid(area) {
    let deck = shuffle(makeDeck());
    deck.push({ joker: true });
    deck = shuffle(deck);
    let you = [],
      cpu = [];
    deck.forEach((c, i) => (i % 2 === 0 ? you : cpu).push(c));
    removePairs(you);
    removePairs(cpu);
    let turn = "you",
      over = false;

    area.innerHTML =
      '<div class="card-status" id="cstatus"></div>' +
      '<div class="om-label">CPUの て（うらむき）</div>' +
      '<div class="hand" id="cpuHand"></div>' +
      '<div class="om-mid" id="omMid"></div>' +
      '<div class="om-label">あなたの て</div>' +
      '<div class="hand" id="youHand"></div>';
    render();
    setMsg("CPUの カードを 1まい えらんでね", "good");

    function removePairs(hand) {
      const byRank = {};
      hand.forEach((c) => {
        if (c.joker) return;
        (byRank[c.rank] = byRank[c.rank] || []).push(c);
      });
      const remove = new Set();
      Object.keys(byRank).forEach((r) => {
        const arr = byRank[r];
        const n = Math.floor(arr.length / 2) * 2;
        for (let i = 0; i < n; i++) remove.add(arr[i]);
      });
      for (let i = hand.length - 1; i >= 0; i--) if (remove.has(hand[i])) hand.splice(i, 1);
    }
    function render() {
      status("あなた <b>" + you.length + "</b>まい　CPU <b>" + cpu.length + "</b>まい");
      const yh = $("youHand");
      yh.innerHTML = "";
      sortHand(you).forEach((c) => yh.appendChild(cardEl(c, true)));
      const ch = $("cpuHand");
      ch.innerHTML = "";
      if (!over) cpu = shuffle(cpu); // ブラインドに する
      cpu.forEach((c, i) => {
        const el = cardEl(c, over);
        if (!over) {
          el.classList.add("pick");
          el.addEventListener("click", () => youDraw(i));
        }
        ch.appendChild(el);
      });
    }
    function youDraw(i) {
      if (turn !== "you" || over) return;
      const card = cpu.splice(i, 1)[0];
      you.push(card);
      removePairs(you);
      render();
      if (end()) return;
      turn = "cpu";
      setMsg("CPUの ばん…", "");
      later(cpuDraw, 1000);
    }
    function cpuDraw() {
      if (over) return;
      const card = you.splice(rand(you.length), 1)[0];
      cpu.push(card);
      removePairs(cpu);
      render();
      if (end()) return;
      turn = "you";
      setMsg("CPUの カードを 1まい えらんでね", "good");
    }
    function end() {
      if (you.length === 0) {
        over = true;
        render();
        setMsg("あがり！ あなたの かち！ 🏆", "good");
        return true;
      }
      if (cpu.length === 0) {
        over = true;
        render();
        setMsg("CPUが あがり… ジョーカーが のこって まけ", "bad");
        return true;
      }
      return false;
    }
  }

  // --- 7ならべ（Sevens）vs CPU3人 ---
  function gameSevens(area) {
    const deck = shuffle(makeDeck());
    const hands = [[], [], [], []];
    deck.forEach((c, i) => hands[i % 4].push(c));
    const board = SUITS.map(() => ({ min: null, max: null }));
    // 7を じどうで ならべる
    for (let p = 0; p < 4; p++) {
      for (let i = hands[p].length - 1; i >= 0; i--) {
        if (hands[p][i].rank === 7) {
          const c = hands[p].splice(i, 1)[0];
          board[c.suit].min = board[c.suit].max = 7;
        }
      }
    }
    let current = 0,
      over = false;

    area.innerHTML =
      '<div class="card-status" id="cstatus"></div>' +
      '<div class="sv-board" id="svBoard"></div>' +
      '<div class="sv-hand-label">あなたの て（おけるカードは みどりわく）</div>' +
      '<div class="hand" id="svHand"></div>' +
      '<div class="sv-controls"><button class="start-btn" id="svPass">パス</button></div>';
    $("svPass").addEventListener("click", doPass);
    render();
    setMsg("あなたの ばん！ おけるカードを タップ", "good");

    function playable(c) {
      const b = board[c.suit];
      if (c.rank === 7) return b.max === null;
      if (b.max === null) return false;
      return c.rank === b.min - 1 || c.rank === b.max + 1;
    }
    function place(card, who) {
      const h = hands[who];
      const idx = h.indexOf(card);
      if (idx >= 0) h.splice(idx, 1);
      const b = board[card.suit];
      if (card.rank === 7) {
        b.min = b.max = 7;
      } else if (card.rank < 7) b.min = card.rank;
      else b.max = card.rank;
    }
    function render() {
      status(
        "あなた " +
          hands[0].length +
          " / CPU① " +
          hands[1].length +
          " / CPU② " +
          hands[2].length +
          " / CPU③ " +
          hands[3].length
      );
      const bd = $("svBoard");
      bd.innerHTML = "";
      SUITS.forEach((su, si) => {
        const row = document.createElement("div");
        row.className = "sv-row";
        const lab = document.createElement("div");
        lab.className = "sv-suit" + (su.red ? " red" : "");
        lab.textContent = su.s;
        row.appendChild(lab);
        const b = board[si];
        if (b.max !== null)
          for (let r = b.min; r <= b.max; r++) {
            const el = cardEl({ suit: si, rank: r }, true);
            el.classList.add("mini");
            row.appendChild(el);
          }
        bd.appendChild(row);
      });
      const hd = $("svHand");
      hd.innerHTML = "";
      sortHand(hands[0]).forEach((c) => {
        const el = cardEl(c, true);
        el.classList.add("mini");
        if (current === 0 && !over && playable(c)) {
          el.classList.add("pick");
          el.addEventListener("click", () => playerPlay(c));
        } else el.classList.add("dim");
        hd.appendChild(el);
      });
    }
    function playerPlay(c) {
      if (current !== 0 || over || !playable(c)) return;
      place(c, 0);
      advance();
    }
    function doPass() {
      if (current !== 0 || over) return;
      advance();
    }
    function advance() {
      if (checkWin()) return;
      current = (current + 1) % 4;
      render();
      if (current === 0) setMsg("あなたの ばん！ おけるカードを タップ", "good");
      else {
        setMsg("CPU" + "①②③"[current - 1] + " の ばん…", "");
        later(cpuPlay, 800);
      }
    }
    function cpuPlay() {
      if (over) return;
      const opts = hands[current].filter(playable);
      if (opts.length) place(pick(opts), current);
      advance();
    }
    function checkWin() {
      for (let p = 0; p < 4; p++) {
        if (hands[p].length === 0) {
          over = true;
          render();
          setMsg(
            p === 0 ? "あがり！ あなたの かち！ 🏆" : "CPU" + "①②③"[p - 1] + " の かち！",
            p === 0 ? "good" : "bad"
          );
          return true;
        }
      }
      return false;
    }
  }

  const CARD_GAMES = {
    label: "トランプゲーム",
    emoji: "🃏",
    games: [
      { title: "しんけいすいじゃく", emoji: "🃏", run: gameMemoryCards, hideScore: true },
      { title: "7ならべ", emoji: "7️⃣", run: gameSevens, hideScore: true },
      { title: "ババぬき", emoji: "🤡", run: gameOldMaid, hideScore: true },
    ],
  };

  // ====================================================
  // データ：年齢グループとゲーム
  // ====================================================
  const AGE_GROUPS = [
    {
      id: "b1",
      label: "1〜2さい",
      emoji: "👶",
      color: "linear-gradient(135deg,#ffd1dc,#ffb3c6)",
      games: [
        { title: "タッチであそぼ", emoji: "👆", run: gameBabyTouch },
        { title: "ぽんぽんバルーン", emoji: "🎈", run: gameBalloon },
      ],
    },
    {
      id: "b2",
      label: "2〜3さい",
      emoji: "🧒",
      color: "linear-gradient(135deg,#ffe29a,#ffc46b)",
      games: [
        { title: "どうぶつタッチ", emoji: "🐻", run: gameBigTap },
        { title: "おおきいの どっち？", emoji: "🔍", run: gameBigSmall },
      ],
    },
    {
      id: "a1",
      label: "3〜4さい",
      emoji: "🍼",
      color: "linear-gradient(135deg,#ff9a9e,#fecfef)",
      games: [
        { title: "どうぶつタップ", emoji: "🐶", run: gameTapAnimal },
        { title: "いろあわせ", emoji: "🎨", run: gameColorMatch },
      ],
    },
    {
      id: "a2",
      label: "5〜6さい",
      emoji: "🧸",
      color: "linear-gradient(135deg,#6ec6ff,#4d96ff)",
      games: [
        { title: "かずをかぞえよう", emoji: "🔢", run: gameCount },
        { title: "かたちあわせ", emoji: "🔺", run: gameShape },
      ],
    },
    {
      id: "a3",
      label: "7〜9さい",
      emoji: "🎒",
      color: "linear-gradient(135deg,#95e06c,#5fbf60)",
      games: [
        { title: "けいさんチャレンジ", emoji: "➕", run: gameMath },
        { title: "きおくゲーム", emoji: "🧠", run: gameMemory },
      ],
    },
    {
      id: "a4",
      label: "10さい〜",
      emoji: "🚀",
      color: "linear-gradient(135deg,#b39ddb,#8e6bd0)",
      games: [
        { title: "もぐらたたき", emoji: "🐹", run: gameMole },
        { title: "かけざんスピード", emoji: "✖️", run: gameMulti },
        { title: "ピアノタイル", emoji: "🎹", run: gamePianoTiles },
      ],
    },
  ];

  // ---- 画面構築 ----
  function renderAgeScreen() {
    showPage("ageScreen", false);
    const grid = $("ageGrid");
    grid.innerHTML = "";
    AGE_GROUPS.forEach((g) => {
      const card = document.createElement("button");
      card.className = "age-card";
      card.style.background = g.color;
      card.innerHTML =
        '<span class="emoji">' + g.emoji + "</span>" + g.label;
      card.addEventListener("click", () => renderMenu(g));
      grid.appendChild(card);
    });
  }

  function renderMenu(group) {
    showPage("menuScreen", false);
    $("menuTitle").textContent = group.emoji + " " + group.label + " のゲーム";
    const grid = $("gameGrid");
    grid.innerHTML = "";
    group.games.forEach((game) => {
      const card = document.createElement("button");
      card.className = "game-card";
      card.innerHTML =
        '<span class="emoji">' + game.emoji + "</span>" + game.title;
      card.addEventListener("click", () => renderGame(game));
      grid.appendChild(card);
    });
  }

  function renderGame(game) {
    setScore(0);
    showPage("gameScreen", !game.hideScore);
    $("gameTitle").textContent = game.emoji + " " + game.title;
    setMsg("");
    game.run($("gameArea"));
  }

  // ---- カテゴリ（ホーム）----
  const CATEGORIES = [
    {
      label: "ねんれいべつ",
      emoji: "👶",
      color: "linear-gradient(135deg,#ff9a9e,#fecfef)",
      open: () => renderAgeScreen(),
    },
    {
      label: "トランプゲーム",
      emoji: "🃏",
      color: "linear-gradient(135deg,#6ec6ff,#4d96ff)",
      open: () => renderMenu(CARD_GAMES),
    },
    {
      label: "スペシャル",
      emoji: "✨",
      color: "linear-gradient(135deg,#f6a6ff,#9b5cff)",
      open: () => renderMenu(SPECIAL_GAMES),
    },
  ];

  function renderHome() {
    showPage("homeScreen", false);
    const grid = $("catGrid");
    grid.innerHTML = "";
    CATEGORIES.forEach((c) => {
      const card = document.createElement("button");
      card.className = "age-card";
      card.style.background = c.color;
      card.innerHTML = '<span class="emoji">' + c.emoji + "</span>" + c.label;
      card.addEventListener("click", c.open);
      grid.appendChild(card);
    });
  }

  // ---- 初期化 ----
  function init() {
    $("homeBtn").addEventListener("click", renderHome);
    renderHome();
  }

  // テスト用にエクスポート
  window.KidsGame = {
    AGE_GROUPS,
    CARD_GAMES,
    SPECIAL_GAMES,
    CATEGORIES,
    init,
    _internal: { uniqueNums, shuffle, makeDeck, rankStr },
  };

  document.addEventListener("DOMContentLoaded", init);
})();
