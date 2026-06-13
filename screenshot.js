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
  const openGame = async (ageLabel, gameNth) => {
    await page.click("#homeBtn");
    await page.click(`#ageGrid .age-card:nth-child(${ageNth[ageLabel]})`);
    await page.waitForSelector("#gameGrid .game-card");
    await page.click(`#gameGrid .game-card:nth-child(${gameNth})`);
  };

  // 1. 年齢えらび画面（6グループ）
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
  await page.click("#homeBtn");
  await page.click(`#ageGrid .age-card:nth-child(${ageNth["3〜4さい"]})`);
  await page.waitForSelector("#gameGrid .game-card");
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

  await browser.close();

  console.log("\n--- ブラウザコンソール ---");
  console.log(logs.length ? logs.join("\n") : "(エラーなし)");
  const errs = logs.filter((l) => l.startsWith("PAGEERROR") || l.startsWith("error"));
  console.log("\nJSエラー数: " + errs.length);
  process.exit(errs.length ? 1 : 0);
})();
