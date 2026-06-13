/* みんなのゲームランド
 * 年齢別に難易度・あそびかたが変わる子供向けゲーム。
 * 3〜5さい: いろ/どうぶつ えらび（よみあげ）
 * 6〜8さい: たしざん・ひきざん
 * 9〜12さい: かけざん タイムアタック
 */

(function () {
  "use strict";

  // ---- 画面の参照 ----
  const screens = {
    home: document.getElementById("screen-home"),
    game: document.getElementById("screen-game"),
    result: document.getElementById("screen-result"),
  };
  const els = {
    score: document.getElementById("score"),
    timer: document.getElementById("timer"),
    question: document.getElementById("question"),
    choices: document.getElementById("choices"),
    feedback: document.getElementById("feedback"),
    resultTitle: document.getElementById("result-title"),
    resultEmoji: document.getElementById("result-emoji"),
    resultScore: document.getElementById("result-score"),
  };

  // ---- ゲームの状態 ----
  const state = {
    age: null,
    score: 0,
    asked: 0,
    maxQuestions: 10,
    timeLeft: 30,
    timerId: null,
    locked: false,
  };

  // ---- ちいさいこ用データ ----
  const COLORS = [
    { name: "あか", emoji: "🟥" },
    { name: "あお", emoji: "🟦" },
    { name: "きいろ", emoji: "🟨" },
    { name: "みどり", emoji: "🟩" },
    { name: "むらさき", emoji: "🟪" },
    { name: "オレンジ", emoji: "🟧" },
  ];
  const ANIMALS = [
    { name: "いぬ", emoji: "🐶" },
    { name: "ねこ", emoji: "🐱" },
    { name: "うさぎ", emoji: "🐰" },
    { name: "ぞう", emoji: "🐘" },
    { name: "ライオン", emoji: "🦁" },
    { name: "さる", emoji: "🐵" },
    { name: "ぶた", emoji: "🐷" },
    { name: "かえる", emoji: "🐸" },
  ];

  // ---- ユーティリティ ----
  function rand(n) { return Math.floor(Math.random() * n); }
  function pick(arr) { return arr[rand(arr.length)]; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // かんたんな音（Web Audio）。失敗しても無視する。
  let audioCtx = null;
  function beep(freq, dur) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.value = 0.15;
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch (e) { /* 音が出せなくても遊べる */ }
  }
  function goodSound() { beep(880, 0.12); setTimeout(() => beep(1175, 0.12), 120); }
  function badSound() { beep(160, 0.2); }

  // ひらがな等のよみあげ（あれば）
  function speak(text) {
    try {
      if (!window.speechSynthesis) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ja-JP";
      u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) { /* よみあげ無しでも遊べる */ }
  }

  // ---- 画面きりかえ ----
  function show(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
  }

  // ---- もんだいを作る ----
  // 年齢ごとに { prompt, promptIsEmoji, answer, choices[], speakText } を返す。
  function makeQuestion(age) {
    if (age === "little") return makeLittleQuestion();
    if (age === "kid") return makeKidQuestion();
    return makeBigQuestion();
  }

  function makeLittleQuestion() {
    // 色か動物のどちらか。絵文字の選択肢から「なまえ」に合うものを選ぶ。
    const useColor = Math.random() < 0.5;
    const pool = useColor ? COLORS : ANIMALS;
    const answer = pick(pool);
    const others = shuffle(pool.filter((x) => x.name !== answer.name)).slice(0, 2);
    const options = shuffle([answer, ...others]);
    return {
      prompt: (useColor ? "「" : "「") + answer.name + "」は どれ？",
      promptIsEmoji: false,
      answerKey: answer.emoji,
      choices: options.map((o) => ({ label: o.emoji, key: o.emoji })),
      speakText: answer.name + "は どれ",
      bigChoices: true,
    };
  }

  function makeKidQuestion() {
    // たしざん（答え0〜20）か ひきざん（答えが負にならない）
    const isAdd = Math.random() < 0.55;
    let a, b, answer, prompt;
    if (isAdd) {
      a = rand(11); b = rand(11); answer = a + b;
      prompt = a + " + " + b + " = ?";
    } else {
      a = rand(20) + 1; b = rand(a + 1); answer = a - b;
      prompt = a + " - " + b + " = ?";
    }
    return buildNumberQuestion(prompt, answer, 20);
  }

  function makeBigQuestion() {
    // かけざん（九九＋すこし上）
    const a = rand(11) + 1; // 1〜11
    const b = rand(11) + 1;
    const answer = a * b;
    return buildNumberQuestion(a + " × " + b + " = ?", answer, 130);
  }

  // 数の問題で、まちがい選択肢を作る共通処理
  function buildNumberQuestion(prompt, answer, maxRange) {
    const set = new Set([answer]);
    let guard = 0;
    while (set.size < 4 && guard++ < 50) {
      const delta = rand(7) - 3; // -3〜+3
      let wrong = answer + (delta === 0 ? 1 : delta);
      if (wrong < 0) wrong = answer + rand(5) + 1;
      if (wrong > maxRange) wrong = Math.max(0, answer - rand(5) - 1);
      set.add(wrong);
    }
    // 4つに満たない時の保険
    let n = 0;
    while (set.size < 4) set.add(maxRange + (++n));
    const choices = shuffle([...set]).map((v) => ({ label: String(v), key: String(v) }));
    return {
      prompt: prompt,
      promptIsEmoji: false,
      answerKey: String(answer),
      choices: choices,
      speakText: null,
      bigChoices: false,
    };
  }

  // ---- もんだいを描画 ----
  function renderQuestion() {
    if (state.asked >= state.maxQuestions && state.age !== "big") {
      return endGame();
    }
    state.locked = false;
    els.feedback.textContent = "";
    const q = makeQuestion(state.age);
    state.current = q;

    els.question.textContent = q.prompt;
    if (q.speakText) speak(q.speakText);

    els.choices.innerHTML = "";
    q.choices.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "choice";
      btn.textContent = c.label;
      btn.addEventListener("click", () => onAnswer(btn, c.key, q.answerKey));
      els.choices.appendChild(btn);
    });
  }

  // ---- こたえたとき ----
  function onAnswer(btn, key, answerKey) {
    if (state.locked) return;
    state.locked = true;
    state.asked++;

    const allBtns = els.choices.querySelectorAll(".choice");
    const correct = key === answerKey;

    if (correct) {
      btn.classList.add("correct", "bounce");
      state.score++;
      els.feedback.textContent = "せいかい！ 🎉";
      goodSound();
    } else {
      btn.classList.add("wrong", "shake");
      // 正解のボタンを光らせる
      allBtns.forEach((b) => { if (b.textContent === answerKey) b.classList.add("correct"); });
      els.feedback.textContent = "おしい！ こたえは " + answerKey;
      badSound();
    }
    allBtns.forEach((b) => (b.disabled = true));
    updateStats();

    const delay = correct ? 700 : 1200;
    setTimeout(renderQuestion, delay);
  }

  function updateStats() {
    els.score.textContent = "⭐ " + state.score;
  }

  // ---- タイマー（9〜12さいのみ）----
  function startTimer() {
    els.timer.classList.remove("hidden");
    state.timeLeft = 30;
    els.timer.textContent = "⏱ " + state.timeLeft;
    state.timerId = setInterval(() => {
      state.timeLeft--;
      els.timer.textContent = "⏱ " + state.timeLeft;
      if (state.timeLeft <= 0) endGame();
    }, 1000);
  }
  function stopTimer() {
    if (state.timerId) clearInterval(state.timerId);
    state.timerId = null;
  }

  // ---- ゲーム開始 ----
  function startGame(age) {
    state.age = age;
    state.score = 0;
    state.asked = 0;
    state.locked = false;
    updateStats();
    els.timer.classList.add("hidden");
    stopTimer();
    if (age === "big") startTimer();
    show("game");
    renderQuestion();
  }

  // ---- 終了 ----
  function endGame() {
    stopTimer();
    let title, emoji, range;
    if (state.age === "big") {
      range = state.score;
      title = state.score >= 12 ? "すごい！ てんさい！" : state.score >= 6 ? "よくできました！" : "ナイスチャレンジ！";
      emoji = state.score >= 12 ? "🏆" : state.score >= 6 ? "🌟" : "💪";
      els.resultScore.textContent = "30びょうで " + state.score + "もん せいかい！";
    } else {
      const total = state.maxQuestions;
      title = state.score === total ? "ぜんもん せいかい！" : state.score >= total * 0.6 ? "よくできました！" : "がんばったね！";
      emoji = state.score === total ? "🏆" : state.score >= total * 0.6 ? "🌟" : "💪";
      els.resultScore.textContent = total + "もんちゅう " + state.score + "もん せいかい！";
    }
    els.resultTitle.textContent = title;
    els.resultEmoji.textContent = emoji;
    speak(title);
    show("result");
  }

  // ---- イベント ----
  document.querySelectorAll(".age-card").forEach((card) => {
    card.addEventListener("click", () => startGame(card.dataset.age));
  });
  document.getElementById("btn-back").addEventListener("click", () => {
    stopTimer();
    show("home");
  });
  document.getElementById("btn-again").addEventListener("click", () => startGame(state.age));
  document.getElementById("btn-home").addEventListener("click", () => show("home"));

  // テスト用に内部関数を公開（ブラウザでは害なし）
  if (typeof window !== "undefined") {
    window.__game = { makeQuestion, buildNumberQuestion, makeLittleQuestion, makeKidQuestion, makeBigQuestion };
  }
})();
