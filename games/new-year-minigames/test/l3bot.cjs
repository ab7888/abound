// Scripted rider for level 3, shared by the tests. Runs inside the page (stringified): one frame per call.
// Stands still on a moving cart, jumps plumes ahead by speed, backs to the tail of a stopped cart and
// runs off its head, walks and jumps gaps on foot. Returns nothing; reads/writes the game's globals.
module.exports = function botFrame() {
  const riding = P.cart && P.cart.moving && P.cart.s < P.cart.tr.len;
  const stopped = P.cart && P.cart.s >= P.cart.tr.len;
  const mid = P.cart && P.cart.segs[4] ? P.cart.segs[4].x + 2 : 0;
  const head = P.cart ? P.cart.segs[0] : null, tail = P.cart ? P.cart.segs[9] : null;
  if (stopped && !P.cart.wound && P.x < tail.x + 40) P.cart.wound = true;
  const backing = stopped && !P.cart.wound;
  if (P.onG) P.hop = false;
  const ahead = tileAt(Math.floor((P.x + 20) / TS), Math.floor((P.y + P.h + 2) / TS));
  // gap/wall jumps only from real tiles: on a cart P.cart can be null for a frame on slopes
  const onTiles = P.onG && !P.cart && !!groundUnder(P);
  const wall = onTiles && solidCh(tileAt(Math.floor((P.x + P.w + 3) / TS), Math.floor((P.y + P.h - 3) / TS)));
  // a waiting cart just past the edge: walk off onto its tail instead of run-jumping over it
  const cartAhead = R.ents.some(c => c.k === 'cart' && c.segs[9] && c.segs[9].x > P.x - 8 && c.segs[9].x < P.x + 70);
  const gap = (onTiles && !solidCh(ahead) && ahead !== '-' && !cartAhead) || wall;
  const spd = Math.abs(P.vx) + (P.cart ? Math.abs(P.cart.dx || 0) : 0);
  const near = (riding || onTiles) && R.ents.find(e => e.k === 'plume' && e.x > P.x && e.x < P.x + 18 + 12 * spd && (e.hgt > 0 || e.warn));
  const hop = stopped && P.cart.wound && head && P.x > head.x + 2;
  // on a moving cart only drift back to the middle when no plume is coming up, so a plume jump
  // starts from rest and does not fly off the head
  const plumeSoon = R.ents.some(e => e.k === 'plume' && e.x > P.x - 20 && e.x < P.x + 150);
  // brake to a stop on a moving cart (hold the opposite direction while sliding)
  const sliding = riding && Math.abs(P.vx) > 0.3;
  const wantRight = P.onG ? (sliding ? P.vx < 0 : (!backing && (!riding || (P.x < mid - 24 && !plumeSoon)))) : P.hop;
  keys.right = wantRight; keys.left = P.onG && (sliding ? P.vx > 0 : (backing || (!!riding && P.x > mid + 24 && !plumeSoon)));
  keys.run = P.onG ? !!((stopped && P.cart.wound) || gap || onTiles) : P.hop;
  if ((near || hop || gap) && P.onG) { pressed.jump = true; keys.jump = true; P.hop = !!(hop || gap); } else keys.jump = P.vy < 0;
  step(); clearPressed();
};
