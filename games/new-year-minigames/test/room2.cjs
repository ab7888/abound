// Room 2 gameplay check: moles patrol the strip, a bumped switch launches the tower,
// a mole crossing the cap is knocked off, the key falls down the chute into the corridor.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 520, height: 420 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../dist/index.html'));
  await page.waitForTimeout(500);
  const run = f => page.evaluate(f => { for (let i = 0; i < f; i++) { step(); clearPressed(); } render(); }, f);
  const state = () => page.evaluate(() => ({
    moles: R.ents.filter(e => e.k === 'critter').map(c => [Math.round(c.x), Math.round(c.y), c.alive]),
    towers: R.ents.filter(e => e.k === 'tower').map(t => [Math.round(t.y), t.fly]),
    key: (k => k && [Math.round(k.x), Math.round(k.y)])(R.ents.find(e => e.k === 'key')),
  }));
  await page.evaluate(() => { startGame(0); G.room = 1; loadRoom(1); iris = { t: 0, dir: 0 }; });
  await run(60);
  const a = await state(); console.log('patrol start', JSON.stringify(a));
  await run(240);
  const b = await state(); console.log('patrol later', JSON.stringify(b));
  if (a.moles[0][0] === b.moles[0][0]) throw new Error('moles do not walk');
  // wait until a mole is over the left shaft cap (cols 7-9), then bump the switch
  let hit = false;
  for (let k = 0; k < 600 && !hit; k++) {
    await run(1);
    const over = await page.evaluate(() => R.ents.some(c => c.k === 'critter' && c.alive && c.x + 7 > 8 * 16 && c.x + 7 < 10 * 16));
    if (over) { await page.evaluate(() => { flipSwitch(8, 11); launchTowers(8, 11); }); hit = true; }
  }
  if (!hit) throw new Error('no mole crossed the left shaft');
  const flight = [];
  for (let k = 0; k < 12; k++) { await run(5); flight.push((await state()).towers[0]); }
  console.log('tower flight', JSON.stringify(flight));
  await run(120);
  const c = await state(); console.log('after launch', JSON.stringify(c));
  if (c.moles.filter(m => m[2]).length !== 1) throw new Error('tower did not knock a mole off');
  if (c.towers[0][1] !== false || c.towers[0][0] !== 80) throw new Error('tower did not settle back on its blocks');
  // knock the other mole with whichever tower it crosses next
  hit = false;
  for (let k = 0; k < 1500 && !hit; k++) {
    await run(1);
    const sx = await page.evaluate(() => { const c = R.ents.find(c => c.k === 'critter' && c.alive); if (!c) return -1; const cx = c.x + 7; if (cx > 8 * 16 && cx < 10 * 16) return 8; if (cx > 18 * 16 && cx < 20 * 16) return 18; return 0; });
    if (sx > 0) { await page.evaluate(sx => { flipSwitch(sx, 11); launchTowers(sx, 11); }, sx); hit = true; }
  }
  await run(300);
  const d = await state(); console.log('after second launch', JSON.stringify(d));
  if (d.moles.some(m => m[2])) throw new Error('a mole survived');
  if (!d.key) throw new Error('no key dropped');
  if (d.key[1] < 12 * 16) throw new Error('key did not reach the corridor: ' + d.key);
  await page.screenshot({ path: path.resolve(__dirname, 'shots/room2-final.png') });
  console.log('errors', errors.length ? errors : 'none');
  if (errors.length) process.exitCode = 1;
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
