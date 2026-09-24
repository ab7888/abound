const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 520, height: 420 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname,'../dist/index.html'));
  await page.waitForTimeout(800);
  const out = path.resolve(__dirname,'shots');
  require('fs').mkdirSync(out, { recursive: true });
  await page.screenshot({ path: out + '/title.png' });
  const n = await page.evaluate(() => LEVELS.length);
  console.log('rooms', n, 'L1 rooms', await page.evaluate(() => L1_ROOMS));
  // run frames deterministically
  const run = (f) => page.evaluate((f) => { for (let i = 0; i < f; i++) { step(); clearPressed(); } render(); }, f);
  await page.evaluate(() => { startGame(0); });
  for (let i = 0; i < n; i++) {
    await page.evaluate((i) => { G.mode = 'play'; G.room = i; loadRoom(i); iris = { t: 0, dir: 0 }; }, i);
    await run(120);
    const info = await page.evaluate(() => ({ title: R.title, ents: R.ents.length, px: P.x, py: P.y, onG: P.onG, dead: P.dead }));
    console.log(i + 1, JSON.stringify(info));
    await page.screenshot({ path: out + `/room${String(i + 1).padStart(2, '0')}.png` });
  }
  // Room 2: towers — flip once, both should fire and key should drop
  await page.evaluate(() => { G.room = 1; loadRoom(1); });
  await run(30);
  await page.evaluate(() => flipSwitch(null, null));
  await run(400);
  console.log('towers', JSON.stringify(await page.evaluate(() => ({ crit: R.ents.filter(e => e.k === 'critter').map(c => c.alive), key: R.ents.some(e => e.k === 'key') }))));
  await page.screenshot({ path: out + '/towers-after.png' });
  // Room 3: key drop — flip, cannon hits critter, key rides belt into chamber
  await page.evaluate(() => { G.room = 2; loadRoom(2); });
  await run(30);
  await page.evaluate(() => flipSwitch(null, null));
  const trace = [];
  for (let k = 0; k < 14; k++) { await run(60); trace.push(await page.evaluate(() => { const key = R.ents.find(e => e.k === 'key'); const c = R.ents.find(e => e.k === 'critter'); return { crit: c && c.alive, key: key && [Math.round(key.x), Math.round(key.y)], balls: R.ents.filter(e => e.k === 'ball').length }; })); }
  console.log('keydrop', JSON.stringify(trace));
  await page.screenshot({ path: out + '/keydrop-after.png' });
  // Room 7: cannon alley — flip, icicle crushes critter, hidden gems revealed
  await page.evaluate(() => { G.room = 6; loadRoom(6); });
  await run(30);
  const before = await page.evaluate(() => ({ gems: R.gemsLeft, hidden: R.ents.filter(e => e.k === 'gem' && e.hidden).length, open: doorOpen() }));
  await page.evaluate(() => flipSwitch(null, null));
  await run(300);
  const after = await page.evaluate(() => ({ crit: R.ents.filter(e => e.k === 'critter').map(c => c.alive), flipped: R.flipped, balls: R.ents.filter(e => e.k === 'ball').length }));
  console.log('alley', JSON.stringify({ before, after }));
  await page.screenshot({ path: out + '/alley-after.png' });
  // Room 8: ball hurts plant
  await page.evaluate(() => { G.room = 7; loadRoom(7); });
  await run(1400);
  console.log('plant', JSON.stringify(await page.evaluate(() => { const p = R.ents.find(e => e.k === 'plant'); return { hp: p && p.hp, alive: p && p.alive, keys: R.ents.filter(e => e.k === 'key').length }; })));
  // Level 2 quick load + cave
  await page.evaluate(() => { startGame(1); });
  await run(200);
  await page.screenshot({ path: out + '/l2-start.png' });
  await page.evaluate(() => { camX = clampCam(48 * 16); P.x = 52 * 16; P.y = 11 * 16; });
  await run(60);
  await page.screenshot({ path: out + '/l2-valley.png' });
  const real = errors.filter(e => !/ERR_CERT|fonts\.g/.test(e)); console.log('errors', real.length ? real : 'none'); if (real.length) process.exitCode = 1;
  await browser.close();
})();
