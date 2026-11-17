// Phone QA via Chrome DevTools Protocol: real device emulation, real rAF, scroll + screenshot.
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const url = process.argv[2]; const W = +process.argv[3] || 390, H = +process.argv[4] || 844;
const stops = process.argv.slice(5).map(Number);
const port = 9333;
const chrome = spawn(CH, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, "--no-first-run", "--user-data-dir=/tmp/cdp-qa-profile", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let ws, id = 0, pending = new Map(), events = [];
async function connect() {
  for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://127.0.0.1:${port}/json`); const tabs = await r.json(); const t = tabs.find(t => t.type === "page"); if (t) { ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; }); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else if (d.method) events.push(d); }; return; } } catch {} await sleep(250); }
  throw new Error("no chrome");
}
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
await connect();
await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true, screenWidth: W, screenHeight: H });
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" });
await send("Page.navigate", { url });
await sleep(9000);
const info = await evalJs(`JSON.stringify({iw:innerWidth, ih:innerHeight, dpr:devicePixelRatio, docW:document.documentElement.scrollWidth, pageH:document.documentElement.scrollHeight, mobileSet: matchMedia('(max-width: 760px)').matches, total: window.SITE.frames.total, mobileTotal: window.SITE.frames.mobileTotal, loaded: performance.getEntriesByType('resource').filter(r=>r.name.includes('/frames/mobile/')).length, wide: [...document.querySelectorAll('body *')].filter(e=>{const b=e.getBoundingClientRect(); return b.width>0 && b.right>innerWidth+1}).map(e=>e.tagName+'.'+[...e.classList].join('.')+'@'+Math.round(e.getBoundingClientRect().right)).slice(0,8)})`);
console.log("INFO", info);
for (const y of stops) {
  await evalJs(`window.scrollTo(0, ${y}); 1`);
  await sleep(1400);
  const st = await evalJs(`JSON.stringify({y:scrollY, ativo:[...document.querySelectorAll('.momento')].map(m=>m.classList.contains('ativo')), visto:[...document.querySelectorAll('.revelar')].filter(e=>e.classList.contains('visto')).length, whats:document.querySelector('.whats').className})`);
  const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 80 });
  writeFileSync(`p_${String(y).padStart(5, "0")}.jpg`, Buffer.from(shot.result.data, "base64"));
  console.log("STOP", st);
}
const errs = events.filter(e => e.method === "Log.entryAdded" && e.params.entry.level === "error").map(e => e.params.entry.text);
console.log("ERRORS", JSON.stringify(errs.slice(0, 5)));
ws.close(); chrome.kill();
