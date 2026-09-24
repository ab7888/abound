# New Year Minigames

A two-level browser platformer (HTML5 canvas, no dependencies) starring a penguin.
Level 1 "Frost festival": 11 single-screen puzzle rooms that follow the flow of the original
course video (switch reveal, launch towers, key drop, conveyor run, NICE! checkpoint, boost hoops,
cannon alley, frost-flower mini-boss, snowman boss, GG!! salute, 2026! epilogue).
Level 2 "Meadow run": a side-scrolling grassland course with a blocky staircase hill, slopes,
crates, lifts, a whirly-cap flight powerup (from the crate in the first valley), 3 sun medallions,
a checkpoint and a secret burrow room.

## Layout
- `src/levels.py` – generates every room's tile map (writes `src/levels.json`).
- `src/engine.js` – the whole game: input, audio, physics, entities, rendering, screens.
- `src/template.html` – page shell; `__LEVELS__` and `__ENGINE__` get inlined.
- `build.py` – runs levels.py and assembles `dist/index.html` (single self-contained file).
- `dist/index.html` – the current playable build. Open it in a browser.
- `test/smoke.cjs` – headless Playwright check: loads every room, exercises the tower, key-drop,
  cannon-alley and frost-flower mechanics, and fails on any JS error.

## Build
    python3 build.py
    NODE_PATH=$(npm root -g) node test/smoke.cjs   # optional, needs playwright + chromium

## Level 1 rooms
1. Ring in the year – hit the switch under the year, door on the centre pedestal.
2. Launch towers – one flip powers both tower bases; both fire and knock off the critters; the
   last critter drops the key.
3. Key drop – the switch powers the cannon in the shaft; its shot knocks the key off the hovering
   critter and the key rides the belt back into the door chamber.
4. Conveyor run – ride the belt right, hit the switch at the far end, return along the snow-puff
   row to the bottom-left door.
5. Nice! – auto-reveal message room with a checkpoint flag.
6. Boost hoops – hoop to the key, hoop back to the locked door.
7. Cannon alley – the switch drops the ice pillar on the critter and reveals the hidden gem trail
   up to the exit; a cannon sweeps the floor.
8. Frost flower – rim cannons and the switch icicles both damage the plant; 3 hits drop the key.
9. The snow giant – boss; icicles from the two switches.
10. Good game – GG!! salute, door exit.
11. Happy new year – 2026! in lights, a switch-block heart, goal flag.

## Tile legend (levels.py)
`#` solid ground/wall · `-` one-way platform · `A`/`T` amber/teal switch blocks (solid when
switch state is 0/1) · `S` switch block (hit from below) · `<` `>` conveyors · `^` spikes ·
`/` `\` 45° slopes · `W` stone block · `b` gem crate · `q` cap (powerup) crate · `u` used crate ·
`H` burrow hole (press down) · `@` player start · `x` return spawn from burrow · `i` entrance door
(decoration) · `e` blob enemy · `o` gem · `h` hidden gem (appears when the switch is flipped) ·
`k` key · `O` sun medallion · `P` spring · `R`/`Q` boost hoop right/left ·
`D` exit door · `L` locked door (needs key) · `G` goal flag · `M` checkpoint · `X` exit ladder ·
`c`/`C` snowball cannon right/left · `K` switch-powered cannon (left, fires only after the flip
while a critter is alive) · `I` hanging icicle in that column · `F` frost flower · `Z` snowman boss ·
`y` launch tower · `z` tower critter (hovers with wings if nothing is under it; carries the key
when it is the only critter in a key room) · `v`/`m` vertical/horizontal lift · `r`/`u`/`d` arrow signs.

Room fields: `theme` (day/night/grass/cave), `door` (switch/key/gems/goal/cave, the exit rule),
`auto` (flip the switch automatically 1 s after entering: message rooms), `level`, and
`sub`/`parent` to link a room with its burrow room.

Free keys ride conveyors. Cannon balls kill critters and damage the frost flower while it is up.
Icicles crush critters. Rooms with `door: key` and critters drop the key where the last critter died.

## Physics (engine.js, px per frame at 60 fps, 16 px tiles)
Walk max 1.56, run max 2.56. Jump vy -4 (or -5 at full run); gravity 0.125 while holding jump
and rising, about 0.44 otherwise. Spring -7.3. Cap: mid-air jump gives vy -6.3, glide fall cap
1.25, hold down to drill.

## Controls
Arrows/WASD move · Z/Space jump · X/Shift run · Up enter door/ladder · Down burrow/drill ·
R restart room · P pause · M mute. Touch buttons appear on phones.
