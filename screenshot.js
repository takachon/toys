/* Playwright で実ブラウザを起動し、各画面・各ゲームを操作してスクリーンショットを撮る */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const path = require("path");
const fs = require("fs");

const SHOT_DIR = path.join(__dirname, "shots");
fs.mkdirSync(SHOT_DIR, { recursive: true });
const url = "http://localhost:8099/index.html";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 420, height: 760 } });
  const logs = [];
  page.on("console", (m) => logs.push(m.type() + ": " + m.text()));
  page.on("pageerror", (e) => logs.push("PAGEERROR: " + e.message));

  await page.goto(url, { waitUntil: "networkidle" });

  const shot = async (name) => {
    await page.screenshot({ path: path.join(SHOT_DIR, name + ".png") });
    console.log("📸 " + name + ".png");
  };

  // 年齢ラベル → カードの番号(1始まり)
  const ageNth = await page.evaluate(() => {
    const map = {};
    window.KidsGame.AGE_GROUPS.forEach((g, i) => (map[g.label] = i + 1));
    return map;
  });
  // カテゴリ → ねんれいべつ → 年齢カードへ
  const gotoAge = async (ageLabel) => {
    await page.click("#homeBtn");
    await page.click("#catGrid .age-card:nth-child(1)"); // ねんれいべつ
    await page.waitForSelector("#ageGrid .age-card");
    await page.click(`#ageGrid .age-card:nth-child(${ageNth[ageLabel]})`);
    await page.waitForSelector("#gameGrid .game-card");
  };
  const openGame = async (ageLabel, gameNth) => {
    await gotoAge(ageLabel);
    await page.click(`#gameGrid .game-card:nth-child(${gameNth})`);
  };
  // カテゴリ → トランプゲーム → メニュー
  const gotoCards = async () => {
    await page.click("#homeBtn");
    await page.click("#catGrid .age-card:nth-child(2)"); // トランプゲーム
    await page.waitForSelector("#gameGrid .game-card");
  };

  // 0. ホーム（カテゴリえらび）
  await page.waitForSelector("#catGrid .age-card");
  await shot("00_home");

  // 1. 年齢えらび画面（6グループ）
  await page.click("#catGrid .age-card:nth-child(1)");
  await page.waitForSelector("#ageGrid .age-card");
  await shot("01_age_select");

  // 1b. タッチであそぼ（1〜2さい）— 画面をタッチして反応
  await page.click(`#ageGrid .age-card:nth-child(${ageNth["1〜2さい"]})`);
  await page.waitForSelector("#gameGrid .game-card");
  await page.click("#gameGrid .game-card:nth-child(1)");
  await page.waitForSelector(".tap-stage");
  await page.mouse.click(210, 380);
  await page.mouse.click(120, 280);
  await page.waitForTimeout(200);
  await shot("01b_baby_touch");

  // 1c. おおきいの どっち？（2〜3さい）
  await openGame("2〜3さい", 2);
  await page.waitForSelector(".choices.two .choice-btn");
  await shot("01c_big_small");

  // 2. 3-4さい メニュー
  await gotoAge("3〜4さい");
  await shot("02_menu_3-4");

  // 3. どうぶつタップ
  await page.click("#gameGrid .game-card:nth-child(1)");
  await page.waitForSelector(".tap-stage");
  await page.waitForSelector(".tap-target");
  await page.click(".tap-target"); // 動物をタップ
  await page.waitForTimeout(200);
  await shot("03_tap_animal");

  // 4. いろあわせ
  await openGame("3〜4さい", 2);
  await page.waitForSelector(".choices .choice-btn");
  await shot("04_color_match");

  // 5. かずをかぞえよう (5-6さい)
  await openGame("5〜6さい", 1);
  await page.waitForSelector(".big-emojis");
  await shot("05_count");

  // 6. けいさんチャレンジ (7-9さい) — 正解を押してスコア確認
  await openGame("7〜9さい", 1);
  await page.waitForSelector(".question");
  const q = await page.textContent(".question");
  const m = q.match(/(\d+)\s*([+\-])\s*(\d+)/);
  const ans = m[2] === "+" ? +m[1] + +m[3] : +m[1] - +m[3];
  const btns = await page.$$(".choice-btn");
  for (const b of btns) {
    if ((await b.textContent()).trim() === String(ans)) {
      await b.click();
      break;
    }
  }
  await page.waitForTimeout(300);
  const scoreAfter = await page.textContent("#score");
  console.log("   けいさん: " + q + " 正解=" + ans + " → スコア=" + scoreAfter);
  await shot("06_math_correct");

  // 7. きおくゲーム
  await openGame("7〜9さい", 2);
  await page.waitForSelector(".memory-grid .memory-card");
  await page.click(".memory-grid .memory-card:nth-child(1)");
  await page.waitForTimeout(150);
  await shot("07_memory");

  // 8. もぐらたたき (10さい〜)
  await openGame("10さい〜", 1);
  await page.waitForSelector(".mole-grid .mole-hole");
  await page.waitForTimeout(500);
  await shot("08_mole");

  // 9. かけざんスピード
  await openGame("10さい〜", 2);
  await page.waitForSelector(".question");
  await shot("09_multiply");

  // 10. ピアノタイル — スタートして黒タイルをタップ
  await openGame("10さい〜", 3);
  await page.waitForSelector("#pstart");
  await shot("10a_piano_start");
  await page.click("#pstart");
  await page.waitForSelector(".piano-tile");
  await page.waitForTimeout(400);
  // 一番下にある黒タイルをタップしてスコアを得る
  const before = await page.textContent("#score");
  await page.evaluate(() => {
    const tiles = [...document.querySelectorAll(".piano-tile")];
    // 一番下（top が最大）のタイルをタップ
    tiles.sort((a, b) => parseFloat(b.style.top) - parseFloat(a.style.top));
    tiles[0].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  });
  await page.waitForTimeout(150);
  const after = await page.textContent("#score");
  console.log("   ピアノタイル: タップ前=" + before + " → タップ後=" + after);
  await shot("10b_piano_play");

  // 11. トランプ：メニュー
  await gotoCards();
  await shot("11_cards_menu");

  // 12. しんけいすいじゃく — 2まいめくる
  await gotoCards();
  await page.click("#gameGrid .game-card:nth-child(1)");
  await page.waitForSelector("#mg .mcard");
  await page.click("#mg .mcard:nth-child(1)");
  await page.click("#mg .mcard:nth-child(6)");
  await page.waitForTimeout(200);
  const upCount = await page.evaluate(() => document.querySelectorAll("#mg .card.up").length);
  console.log("   しんけいすいじゃく: めくれた枚数=" + upCount);
  await shot("12_memory_cards");

  // 13. 7ならべ — おけるカードを1枚プレイ（置けるまで待つ）
  await gotoCards();
  await page.click("#gameGrid .game-card:nth-child(2)");
  await page.waitForSelector("#svBoard .sv-row");
  const countHand = () => page.evaluate(() => document.querySelectorAll("#svHand .card").length);
  const handBefore = await countHand();
  await shot("13a_sevens");
  let played = false;
  for (let attempt = 0; attempt < 8 && !played; attempt++) {
    const pickable = await page.$("#svHand .card.pick");
    if (pickable) {
      const hb = await countHand();
      await pickable.click();
      await page.waitForTimeout(250);
      played = (await countHand()) === hb - 1;
    } else {
      await page.click("#svPass"); // 置けないのでパス→CPUが場を広げる
      await page.waitForTimeout(2700);
    }
  }
  const handAfter = await countHand();
  console.log("   7ならべ: 手札 " + handBefore + " → " + handAfter + " / プレイ成功=" + played);
  await shot("13b_sevens_played");

  // 14. ババぬき — CPUから1枚ひく
  await gotoCards();
  await page.click("#gameGrid .game-card:nth-child(3)");
  await page.waitForSelector("#cpuHand .card");
  const youBefore = await page.evaluate(() => document.querySelectorAll("#youHand .card").length);
  await shot("14a_oldmaid");
  await page.click("#cpuHand .card:nth-child(1)");
  await page.waitForTimeout(300);
  const youAfter = await page.evaluate(() => document.querySelectorAll("#youHand .card").length);
  console.log("   ババぬき: 自分の手札 " + youBefore + " → " + youAfter + "（ひいた結果）");
  await shot("14b_oldmaid_drawn");

  await browser.close();

  console.log("\n--- ブラウザコンソール ---");
  console.log(logs.length ? logs.join("\n") : "(エラーなし)");
  const errs = logs.filter((l) => l.startsWith("PAGEERROR") || l.startsWith("error"));
  console.log("\nJSエラー数: " + errs.length);
  process.exit(errs.length ? 1 : 0);
})();
