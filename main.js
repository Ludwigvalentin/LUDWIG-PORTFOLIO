(() => {
  const track = document.querySelector('.art-gallery-track');
  if (!track) return;
  const cards = [...track.querySelectorAll('.art-work')];
  const controls = document.querySelector('.art-gallery-controls');
  const previous = controls.querySelector('.art-gallery-prev');
  const next = controls.querySelector('.art-gallery-next');
  const dots = controls.querySelector('.art-gallery-dots');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  const position = (card) => card.offsetLeft - cards[0].offsetLeft;
  const goTo = (index) => track.scrollTo({
    left: Math.min(position(cards[Math.max(0, Math.min(cards.length - 1, index))]), track.scrollWidth - track.clientWidth),
    behavior: reducedMotion.matches ? 'instant' : 'smooth'
  });
  cards.forEach((card, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Vis ${card.querySelector('h3').textContent}`);
    button.setAttribute('aria-controls', track.id);
    button.addEventListener('click', () => goTo(index));
    dots.append(button);
  });
  const update = () => {
    const maximum = track.scrollWidth - track.clientWidth;
    current = cards.reduce((best, card, index) =>
      Math.abs(Math.min(position(card), maximum) - track.scrollLeft) <
      Math.abs(Math.min(position(cards[best]), maximum) - track.scrollLeft) ? index : best, 0);
    if (maximum > 2 && track.scrollLeft >= maximum - 2) current = cards.length - 1;
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= maximum - 2;
    [...dots.children].forEach((button, index) => button.setAttribute('aria-current', String(index === current)));
  };
  // Flere værker kan dele sidste stop på brede skærme. Navigér efter
  // faktiske scrollpositioner, så tilbagepilen altid bevæger galleriet.
  const move = (direction) => {
    const maximum = track.scrollWidth - track.clientWidth;
    const stops = [...new Set(cards.map(card => Math.min(position(card), maximum)))];
    const target = direction > 0
      ? stops.find(stop => stop > track.scrollLeft + 2)
      : [...stops].reverse().find(stop => stop < track.scrollLeft - 2);
    if (target !== undefined) track.scrollTo({left: target, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
  };
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('keydown', (event) => {
    if (event.target !== track) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') goTo(0);
    else if (event.key === 'End') goTo(cards.length - 1);
    else move(event.key === 'ArrowRight' ? 1 : -1);
  });
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  controls.hidden = false;
  update();
})();
