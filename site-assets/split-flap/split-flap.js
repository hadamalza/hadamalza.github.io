// Vanilla adaptation of React Bits SplitFlapText, by David Haz.
// https://github.com/DavidHDev/react-bits — license in this directory.
(() => {
  const board = document.querySelector('.split-flap-text');
  if (!board) return;
  const text = [...board.dataset.text];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const glyphs = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  let frame = 0;
  let running = false;
  const prefix = 'split-flap-text__';
  const tiles = text.map(character => {
    const tile = document.createElement('span');
    tile.className = prefix + 'tile' + (character === ' ' ? ' is-space' : '');
    tile.setAttribute('aria-hidden', 'true');
    return tile;
  });
  function part(type, character) {
    const element = document.createElement('span');
    element.className = type.split(' ').map(name => prefix + name).join(' ');
    const glyph = document.createElement('span');
    glyph.className = prefix + 'char';
    glyph.textContent = character === ' ' ? '\u00a0' : character;
    element.append(glyph);
    return element;
  }
  function render(tile, current, next, flipping) {
    if (tile.classList.contains('is-space')) return;
    tile.classList.toggle('is-flipping', flipping);
    tile.replaceChildren(part('half half--top', next), part('half half--bottom', current));
    if (flipping) tile.append(part('flap flap--front', current), part('flap flap--back', next));
  }
  function settle() {
    cancelAnimationFrame(frame);
    running = false;
    tiles.forEach((tile, i) => render(tile, text[i], text[i], false));
  }
  function play() {
    if (motion.matches || document.hidden) { settle(); return; }
    if (running) return;
    running = true;
    const duration = 140;
    const started = performance.now();
    const plans = text.map((target, i) => ({
      start: i * 65, step: -1,
      sequence: [...Array.from({length: 6}, () => glyphs[Math.floor(Math.random() * glyphs.length)]), target]
    }));
    tiles.forEach((tile, i) => render(tile, text[i], text[i], false));
    function tick(now) {
      let pending = false;
      plans.forEach((plan, i) => {
        if (text[i] === ' ') return;
        const elapsed = now - started - plan.start;
        if (elapsed < 0) { pending = true; return; }
        const step = Math.floor(elapsed / duration);
        if (step < plan.sequence.length) {
          pending = true;
          if (step !== plan.step) {
            render(tiles[i], step ? plan.sequence[step - 1] : text[i], plan.sequence[step], true);
            plan.step = step;
          }
        } else render(tiles[i], text[i], text[i], false);
      });
      if (pending) frame = requestAnimationFrame(tick);
      else settle();
    }
    frame = requestAnimationFrame(tick);
  }
  board.replaceChildren(...tiles);
  settle();
  board.addEventListener('click', play);
  motion.addEventListener('change', settle);
  document.addEventListener('visibilitychange', () => { if (document.hidden) settle(); });
  play();
})();
