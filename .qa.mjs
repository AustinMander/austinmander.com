import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport:{width:1400,height:1200}, deviceScaleFactor:2 })).newPage();
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>m.type()==="error"&&errs.push(m.text()));
await p.goto("http://localhost:3215/", { waitUntil:"networkidle" });
await p.waitForTimeout(1200);
const s = await p.evaluate(()=>({
  verdict: document.querySelector(".verdict__badge").textContent.trim(),
  fixtures: document.querySelectorAll(".fx").length,
  checks: document.querySelectorAll(".res").length,
  tags: [...document.querySelectorAll(".tag")].map(t=>t.textContent.trim()),
  lines: document.querySelectorAll("#doc tbody tr").length,
}));
console.log("Q-001 clean control:", JSON.stringify(s));
await p.screenshot({ path:"/tmp/loomshots/qa-clean.png" });

// the refusal fixture
await p.getByRole("button", { name: /Nothing to check against/ }).click();
await p.waitForTimeout(600);
const r = await p.evaluate(()=>({
  verdict: document.querySelector(".verdict__badge").textContent.trim(),
  cannot: [...document.querySelectorAll(".tag")].filter(t=>/CANNOT/.test(t.textContent)).length,
  summaries: [...document.querySelectorAll(".res__sum")].map(n=>n.textContent.trim()).slice(0,4),
}));
console.log("Q-008 refusal:", JSON.stringify(r, null, 1));
await p.screenshot({ path:"/tmp/loomshots/qa-refusal.png" });
await b.close();
console.log("errors:", errs.length?errs:"none");
