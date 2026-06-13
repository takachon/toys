/* jsdom で index.html を読み込み、各ゲームを実際に操作して動作検証する */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const js = fs.readFileSync(path.join(__dirname, "game.js"), "utf8");

let pass = 0,
  fail = 0;
function ok(name, cond) {
  if (cond) {
    pass++;
    console.log("  ✅ " + name);
  } else {
    fail++;
    console.log("  ❌ " + name);
  }
}

const dom = new JSDOM(html, { runScripts: "outside-only", pretendToBeVisual: true });
const { window } = dom;
global.window = window;
// game.js を window コンテキストで実行
window.eval(js);
const doc = window.document;

// DOMContentLoaded を発火
window.document.dispatchEvent(new window.Event("DOMContentLoaded"));

const KG = window.KidsGame;

console.log("\n== 構造テスト ==");
ok("6つの年齢グループがある", KG.AGE_GROUPS.length === 6);
ok("1〜2さい/2〜3さいが先頭にある", KG.AGE_GROUPS[0].label === "1〜2さい" && KG.AGE_GROUPS[1].label === "2〜3さい");
ok("各グループにゲームがある", KG.AGE_GROUPS.every((g) => g.games.length >= 2));
ok("年齢えらび画面が表示されている", !doc.getElementById("ageScreen").classList.contains("hidden"));
ok("年齢カードが6つ描画された", doc.getElementById("ageGrid").children.length === 6);

console.log("\n== uniqueNums ロジック ==");
const u = KG._internal.uniqueNums(5, 3, 0, 40);
ok("正解を含む3つの選択肢", u.length === 3 && u.includes(5));
ok("選択肢に重複がない", new Set(u).size === u.length);

function click(el) {
  el.dispatchEvent(new window.Event("click", { bubbles: true }));
}

// 年齢グループ→ゲームを順番に起動してクラッシュしないか確認
console.log("\n== 全ゲーム起動テスト ==");
KG.AGE_GROUPS.forEach((g, gi) => {
  click(doc.getElementById("ageGrid").children[gi]); // 年齢選択
  const menuVisible = !doc.getElementById("menuScreen").classList.contains("hidden");
  ok(g.label + ": メニュー表示", menuVisible);
  g.games.forEach((game, idx) => {
    // メニューに戻る（ホーム→再選択）
    click(doc.getElementById("homeBtn"));
    click(doc.getElementById("ageGrid").children[gi]);
    click(doc.getElementById("gameGrid").children[idx]);
    const area = doc.getElementById("gameArea");
    ok(g.label + " / " + game.title + ": 起動して要素描画", area.children.length > 0);
  });
});

// 年齢ラベルからカードの位置を引く
const ageIndex = (label) => KG.AGE_GROUPS.findIndex((g) => g.label === label);

// けいさんチャレンジで正解を押すとスコアが増えるか
console.log("\n== あそびテスト（けいさん）==");
click(doc.getElementById("homeBtn"));
click(doc.getElementById("ageGrid").children[ageIndex("7〜9さい")]);
click(doc.getElementById("gameGrid").children[0]); // けいさんチャレンジ
const q = doc.querySelector(".question").textContent; // "a + b = ?"
const m = q.match(/(\d+)\s*([+\-])\s*(\d+)/);
const a = +m[1],
  op = m[2],
  b = +m[3];
const answer = op === "+" ? a + b : a - b;
const before = +doc.getElementById("score").textContent;
const btns = [...doc.querySelectorAll(".choice-btn")];
const correctBtn = btns.find((x) => +x.textContent === answer);
ok("正解の選択肢が存在する", !!correctBtn);
click(correctBtn);
const after = +doc.getElementById("score").textContent;
ok("正解でスコアが増える (" + before + "→" + after + ")", after === before + 1);

// 色あわせで正しい色を押すとスコアが増える
console.log("\n== あそびテスト（いろあわせ）==");
click(doc.getElementById("homeBtn"));
click(doc.getElementById("ageGrid").children[ageIndex("3〜4さい")]);
click(doc.getElementById("gameGrid").children[1]); // いろあわせ
const hexToRgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return "rgb(" + ((n >> 16) & 255) + ", " + ((n >> 8) & 255) + ", " + (n & 255) + ")";
};
const colorMap = { あか: "#ff6b6b", あお: "#4d96ff", きいろ: "#ffd93d", みどり: "#6bcb77" };
const target = doc.querySelector(".question").textContent.match(/「(.+?)」/)[1];
const cbtns = [...doc.querySelectorAll(".choice-btn")];
const wantColor = hexToRgb(colorMap[target]);
const correctColor = cbtns.find((x) => x.style.backgroundColor === wantColor);
const cBefore = +doc.getElementById("score").textContent;
ok("正しい色ボタンが見つかる", !!correctColor);
if (correctColor) click(correctColor);
ok("正しい色でスコア加算", +doc.getElementById("score").textContent === cBefore + 1);

console.log("\n========================");
console.log("結果: " + pass + " 成功 / " + fail + " 失敗");
console.log("========================");
process.exit(fail === 0 ? 0 : 1);
