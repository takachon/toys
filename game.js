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
    ["ageScreen", "menuScreen", "gameScreen"].forEach((p) =>
      $(p).classList.add("hidden")
    );
    $(pageId).classList.remove("hidden");
    $("topbar").classList.toggle("hidden", pageId === "ageScreen");
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
    showPage("gameScreen", true);
    $("gameTitle").textContent = game.emoji + " " + game.title;
    setMsg("");
    game.run($("gameArea"));
  }

  // ---- 初期化 ----
  function init() {
    $("homeBtn").addEventListener("click", renderAgeScreen);
    renderAgeScreen();
  }

  // テスト用にエクスポート
  window.KidsGame = { AGE_GROUPS, init, _internal: { uniqueNums, shuffle } };

  document.addEventListener("DOMContentLoaded", init);
})();
