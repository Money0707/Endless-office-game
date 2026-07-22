(() => {
  const seenByScene = new Map();

  function getSceneKey(layout) {
    const classes = Array.from(layout.classList).filter((name) => name.startsWith('scene-') || name.startsWith('theme-'));
    return classes.sort().join('|') || layout.className;
  }

  function getVisibleHotspots(layout) {
    return Array.from(layout.querySelectorAll('.sceneFrame .hotspot')).filter((button) => {
      const style = window.getComputedStyle(button);
      return style.display !== 'none' && style.visibility !== 'hidden' && button.offsetParent !== null;
    });
  }

  function ensureGateCard(panel) {
    let card = panel.querySelector('.investigationGate');
    if (card) return card;

    card = document.createElement('section');
    card.className = 'investigationGate';
    card.setAttribute('aria-live', 'polite');
    card.innerHTML = `
      <p class="gateKicker">Read The Scene First</p>
      <h3>Click every eye icon to read the story.</h3>
      <p class="gateCopy">The choices will appear after you inspect every clue on the left image.</p>
      <div class="gateProgress" aria-hidden="true"></div>
      <p class="gateCount"></p>
    `;
    panel.insertBefore(card, panel.firstChild);
    return card;
  }

  function updateGate() {
    const layout = document.querySelector('.immersiveLayout');
    if (!layout) return;

    const panel = layout.querySelector('.actionPanel');
    const choices = layout.querySelector('.choicesList');
    if (!panel || !choices || panel.classList.contains('storybookMode')) return;

    const hotspots = getVisibleHotspots(layout);
    const choiceButtons = Array.from(choices.querySelectorAll('.choiceButton'));
    const shouldGate = hotspots.length > 0 && choiceButtons.length > 0;

    if (!shouldGate) {
      panel.classList.remove('investigationLocked');
      panel.querySelector('.investigationGate')?.remove();
      return;
    }

    const key = getSceneKey(layout);
    const seen = seenByScene.get(key) || new Set();
    const total = hotspots.length;
    const read = Math.min(seen.size, total);
    const unlocked = read >= total;

    panel.classList.toggle('investigationLocked', !unlocked);

    const card = ensureGateCard(panel);
    card.hidden = unlocked;
    const count = card.querySelector('.gateCount');
    if (count) count.textContent = `${read} / ${total} clues read`;

    const progress = card.querySelector('.gateProgress');
    if (progress) {
      progress.innerHTML = '';
      hotspots.forEach((hotspot) => {
        const dot = document.createElement('span');
        const label = hotspot.getAttribute('aria-label') || hotspot.textContent || '';
        dot.className = seen.has(label) ? 'read' : '';
        progress.appendChild(dot);
      });
    }
  }

  document.addEventListener('pointerdown', (event) => {
    const hotspot = event.target instanceof Element ? event.target.closest('.sceneFrame .hotspot') : null;
    if (!hotspot) return;

    const layout = hotspot.closest('.immersiveLayout');
    if (!layout) return;

    const key = getSceneKey(layout);
    const seen = seenByScene.get(key) || new Set();
    seen.add(hotspot.getAttribute('aria-label') || hotspot.textContent || 'clue');
    seenByScene.set(key, seen);
    window.setTimeout(updateGate, 40);
  }, true);

  const observer = new MutationObserver(() => updateGate());
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  window.addEventListener('load', updateGate);
  window.addEventListener('resize', updateGate);
  window.setInterval(updateGate, 700);
})();
