// Level 3 ride-through: the cart waits until boarded, carries the rider to its hook, an erupting
// plume kills a standing rider, and the scripted rider (l3bot.cjs) reaches the checkpoint and the flag.
const { chromium } = require('playwright');
const path = require('path');
const bot = require('./l3bot.cjs').toString();
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 520, height: 420 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../dist/index.html'));
  await page.waitForTimeout(500);
  const shots = path.resolve(__dirname, 'shots');
  const run = f => page.evaluate(f => { for (let i = 0; i < f; i++) { step(); clearPressed(); } render(); }, f);
  const st = () => page.evaluate(() => ({ px: Math.round(P.x), py: Math.round(P.y), dead: P.dead, cart: R.ents.filter(e => e.k === 'cart').map(c => [Math.round(c.s), c.moving]) }));
  await page.evaluate((b) => { window.botFrame = eval('(' + b + ')'); startGame(2); iris = { t: 0, dir: 0 }; }, bot);
  await run(30);
  let s = await st(); console.log('start', JSON.stringify(s));
  if (s.cart.length !== 5) throw new Error('expected 5 carts, got ' + s.cart.length);
  if (s.cart.some(c => c[1])) throw new Error('a cart moved before being boarded');
  await page.screenshot({ path: shots + '/l3-start.png' });
  await page.evaluate(() => { keys.right = true; });
  await run(260);
  await page.evaluate(() => { keys.right = false; });
  s = await st(); console.log('boarded', JSON.stringify(s));
  if (!s.cart[0][1]) throw new Error('cart 1 did not start when boarded');
  for (let k = 0; k < 900; k++) { const end = await page.evaluate(() => { botFrame(); const c = R.ents.find(e => e.k === 'cart'); return c.s >= c.tr.len || P.dead > 0; }); if (end) break; }
  await run(20);
  s = await st(); console.log('at hook', JSON.stringify(s));
  const atEnd = await page.evaluate(() => { const c = R.ents.find(e => e.k === 'cart'); return c.s >= c.tr.len && P.y < 100 && !P.dead; });
  if (!atEnd) throw new Error('cart 1 did not carry the rider to its hook');
  await page.screenshot({ path: shots + '/l3-hook.png' });
  const killed = await page.evaluate(() => { const e = R.ents.find(e => e.k === 'plume'); G.frame = e.period * 10 - e.off + 50; P.x = e.x - 6; P.y = e.base - e.hmax + 20; P.inv = 0; step(); clearPressed(); return P.dead > 0; });
  console.log('plume kills', killed);
  if (!killed) throw new Error('plume did not kill');
  // full scripted run from the start
  await page.evaluate(() => { G.room = LEVEL_INFO[2].start; G.checkpoint = null; loadRoom(G.room); iris = { t: 0, dir: 0 }; });
  let deaths = 0, best = 0, done = false, shotCp = false;
  for (let k = 0; k < 16000 && !done; k++) {
    const r = await page.evaluate(() => { botFrame(); return [P.dead === 1, Math.round(P.x), G.mode !== 'play' || P.win > 0, !!G.checkpoint]; });
    best = Math.max(best, r[1]); done = r[2];
    if (r[3] && !shotCp) { shotCp = true; await page.evaluate(() => render()); await page.screenshot({ path: shots + '/l3-checkpoint.png' }); }
    if (r[0]) { deaths++; console.log('death at', r[1]); if (deaths > 8) break; for (let i = 0; i < 200; i++) await page.evaluate(() => { step(); clearPressed(); }); }
  }
  const cp = await page.evaluate(() => G.checkpoint && Math.round(G.checkpoint.x / 16));
  console.log('run result', JSON.stringify({ best, deaths, checkpoint: cp, done, medals: await page.evaluate(() => G.medals) }));
  await page.evaluate(() => render());
  await page.screenshot({ path: shots + '/l3-end.png' });
  if (cp !== 250) throw new Error('checkpoint not reached');
  if (!done) throw new Error('scripted rider did not reach the flag; best x=' + best);
  console.log('errors', errors.length ? errors : 'none');
  if (errors.length) process.exitCode = 1;
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
